-- Fix generator function permissions and path
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
  exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = result) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  return result;
END;
$$;

-- Update trigger to handle empty strings and ensure robustness
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
  -- Generate referral code first
  new_referral_code := generate_unique_referral_code();

  -- Try to find referrer if code is provided in metadata
  referrer_code := new.raw_user_meta_data->>'referred_by_code';
  
  -- Only look up if code is not null and not empty
  IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = referrer_code;
  END IF;

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
