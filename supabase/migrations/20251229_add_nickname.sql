-- 1. Add nickname column
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "nickname" TEXT UNIQUE;

-- 2. Update trigger to lookup by nickname OR referral_code
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
  -- Check if CPF already exists
  cpf_check := new.raw_user_meta_data->>'cpf_cnpj';
  
  IF cpf_check IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE cpf_cnpj = cpf_check) THEN
      RAISE EXCEPTION 'CPF/CNPJ já cadastrado no sistema.';
    END IF;
  END IF;

  -- Generate Referral Code
  BEGIN
    new_referral_code := generate_unique_referral_code();
  EXCEPTION WHEN OTHERS THEN
    new_referral_code := substr(md5(random()::text), 1, 6);
  END;

  -- Find Referrer (Enhanced Logic)
  BEGIN
    referrer_code := new.raw_user_meta_data->>'referred_by_code';
    
    IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
      -- Try to find by referral_code OR nickname
      -- Note: referral_code is 6 chars, nickname can be anything.
      -- We prioritize referral_code match, then nickname.
      SELECT id INTO referrer_id FROM public.profiles 
      WHERE referral_code = referrer_code OR nickname = referrer_code
      LIMIT 1;
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
    nickname,
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
    NULL, -- Nickname starts empty, user sets it later
    referrer_id
  );
    
  return new;
END;
$$;
