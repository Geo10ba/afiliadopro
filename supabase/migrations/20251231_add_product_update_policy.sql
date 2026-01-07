-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own products" ON "public"."products";
DROP POLICY IF EXISTS "Admins can update all products" ON "public"."products";
DROP POLICY IF EXISTS "Admins can delete products" ON "public"."products";
DROP POLICY IF EXISTS "Users can delete own products" ON "public"."products";

-- Allow users to update their own products
CREATE POLICY "Users can update own products"
ON "public"."products"
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Allow admins to update all products
CREATE POLICY "Admins can update all products"
ON "public"."products"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete products
CREATE POLICY "Admins can delete products"
ON "public"."products"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow owners to delete their own products
CREATE POLICY "Users can delete own products"
ON "public"."products"
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);
