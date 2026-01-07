-- Enable INSERT for authenticated users (or admins)
CREATE POLICY "Enable insert for authenticated users" 
ON "public"."commissions" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Enable DELETE for authenticated users (or admins)
CREATE POLICY "Enable delete for authenticated users" 
ON "public"."commissions" 
FOR DELETE 
TO authenticated 
USING (true);

-- Optional: Enable UPDATE if needed later
CREATE POLICY "Enable update for authenticated users" 
ON "public"."commissions" 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
