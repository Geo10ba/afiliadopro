-- Force cleanup of orphaned profiles and their dependencies

-- 1. Delete orders associated with orphaned profiles (Corrected column: user_id)
DELETE FROM public.orders 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE id NOT IN (SELECT id FROM auth.users)
);

-- 2. Delete orphaned profiles (now safe to delete)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 3. Ensure the trigger is robust (Idempotent)
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
  cpf_check TEXT;
BEGIN
  -- Check if CPF already exists (Double check)
  cpf_check := new.raw_user_meta_data->>'cpf_cnpj';
  IF EXISTS (SELECT 1 FROM public.profiles WHERE cpf_cnpj = cpf_check) THEN
    -- If we still find a duplicate after cleanup, it means it belongs to an ACTIVE user.
    RAISE EXCEPTION 'CPF/CNPJ já cadastrado no sistema.';
  END IF;

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
  );
    
  return new;
END;
$$;
