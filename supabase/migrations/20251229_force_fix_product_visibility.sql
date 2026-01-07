-- Drop the existing policy to avoid conflict and ensure it's correct
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."products";

-- Recreate the policy allowing ALL authenticated users to view
CREATE POLICY "Enable read access for all authenticated users"
ON "public"."products"
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
