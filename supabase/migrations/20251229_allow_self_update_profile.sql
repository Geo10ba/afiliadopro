-- Allow users to update their own profile (e.g. nickname)
CREATE POLICY "Users can update own profile" 
ON "public"."profiles" 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled (just in case)
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Grant update permission on the specific column (optional but good practice if we want to limit scope, but for now full update is fine)
GRANT UPDATE (nickname) ON TABLE "public"."profiles" TO authenticated;
