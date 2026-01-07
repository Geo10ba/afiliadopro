-- Allow all authenticated users (affiliates and admins) to view products
CREATE POLICY "Enable read access for all authenticated users"
ON "public"."products"
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
