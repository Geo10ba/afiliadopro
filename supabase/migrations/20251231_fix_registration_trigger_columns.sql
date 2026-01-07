-- Fix handle_new_user to include phone and cpf_cnpj AND fix referral code length
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  referrer_id uuid;
  referral_code_input text;
  new_referral_code text;
BEGIN
  -- Get referral code from metadata
  referral_code_input := new.raw_user_meta_data->>'referred_by_code';

  -- If referral code exists, find the user
  IF referral_code_input IS NOT NULL AND referral_code_input <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = referral_code_input OR nickname = referral_code_input LIMIT 1;
  END IF;

  -- Generate a 6-character referral code
  -- Try to use the existing function, otherwise fallback to substring of md5
  BEGIN
    new_referral_code := public.generate_unique_referral_code();
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if function doesn't exist
    new_referral_code := substr(md5(random()::text), 1, 6);
  END;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    referred_by, 
    referral_code,
    phone,
    cpf_cnpj
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'affiliate'),
    referrer_id, -- Set the referrer ID if found
    new_referral_code, -- Use the 6-char code
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf_cnpj'
  );
  RETURN new;
END;
$$;
