-- Completely reset the registration trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with basic logic and explicit permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone, 
    cpf_cnpj, 
    role
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf_cnpj',
    COALESCE(new.raw_user_meta_data->>'role', 'affiliate')
  );
  return new;
EXCEPTION WHEN OTHERS THEN
  -- If insertion fails, we log it (if we could) but we don't block auth creation?
  -- No, we MUST block auth creation if profile fails, otherwise we have inconsistent state.
  -- But for debugging, let's raise the specific error to see if Supabase shows it.
  RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ensure permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.profiles TO postgres;
-- Allow authenticated users to read/update their own profile (standard RLS)
-- But the trigger runs as SECURITY DEFINER (superuser), so it shouldn't matter.
