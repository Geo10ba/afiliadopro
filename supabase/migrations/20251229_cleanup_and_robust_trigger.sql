-- 1. Clean up orphaned profiles (profiles without a matching auth user)
-- This fixes the issue where a user was deleted from Auth but remains in Profiles, blocking re-registration with same Email/CPF.
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Re-apply the MLM logic with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id UUID;
  referrer_code TEXT;
  new_referral_code TEXT;
BEGIN
  -- Generate Referral Code (Defensive)
  BEGIN
    new_referral_code := generate_unique_referral_code();
  EXCEPTION WHEN OTHERS THEN
    new_referral_code := substr(md5(random()::text), 1, 6);
  END;

  -- Find Referrer (Defensive)
  BEGIN
    referrer_code := new.raw_user_meta_data->>'referred_by_code';
    IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
      SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = referrer_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    referrer_id := NULL;
  END;

  -- Insert with conflict handling for Email/CPF
  -- If a profile with this ID already exists (unlikely), update it.
  -- If a profile with this Email/CPF exists (but different ID), the INSERT will still fail, 
  -- BUT we just cleaned orphans, so it should be fine.
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone, 
    cpf_cnpj, 
    role, 
    referral_code, 
    referred_by
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf_cnpj',
    COALESCE(new.raw_user_meta_data->>'role', 'affiliate'),
    new_referral_code,
    referrer_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
    
  return new;
END;
$$;
