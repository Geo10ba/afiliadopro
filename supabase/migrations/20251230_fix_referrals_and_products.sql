-- Add commission_rate to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;

-- Function to handle new user registration and link referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  referrer_id uuid;
  referral_code_input text;
BEGIN
  -- Get referral code from metadata
  referral_code_input := new.raw_user_meta_data->>'referred_by_code';

  -- If referral code exists, find the user
  IF referral_code_input IS NOT NULL AND referral_code_input <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = referral_code_input OR nickname = referral_code_input LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, referred_by, referral_code)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'affiliate'),
    referrer_id, -- Set the referrer ID if found
    encode(gen_random_bytes(6), 'hex') -- Generate a random referral code for the new user
  );
  RETURN new;
END;
$$;
