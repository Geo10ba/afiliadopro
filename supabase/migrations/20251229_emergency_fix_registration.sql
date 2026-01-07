-- Ensure columns exist (Idempotent)
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "referral_code" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "referred_by" UUID REFERENCES "public"."profiles"("id");

-- Simplified Generator (Robust)
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  -- Simple generation without loop check first to avoid recursion/permission issues
  -- We accept a tiny risk of collision for now to unblock registration
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  return result;
END;
$$;

-- Defensive Trigger
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
  -- 1. Generate Referral Code (Defensive)
  BEGIN
    new_referral_code := generate_unique_referral_code();
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if function fails
    new_referral_code := substr(md5(random()::text), 1, 6);
  END;

  -- 2. Find Referrer (Defensive)
  BEGIN
    referrer_code := new.raw_user_meta_data->>'referred_by_code';
    
    IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
      SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = referrer_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    referrer_id := NULL;
  END;

  -- 3. Insert (Standard)
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
