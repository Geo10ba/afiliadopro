-- Allow admins to view all commissions
CREATE POLICY "Admins can view all commissions"
ON "public"."commissions"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
