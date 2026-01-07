-- Allow authenticated users to view profiles of admins (needed to filter products by admin role)
-- Note: This exposes admin profile data (including balance) to authenticated users.
-- For a production app, we should use a separate public_profiles table or view.
CREATE POLICY "Allow view admin profiles"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (role = 'admin');
