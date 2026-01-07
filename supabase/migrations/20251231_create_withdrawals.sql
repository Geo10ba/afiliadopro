-- Create withdrawals table
CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "amount" DECIMAL(10, 2) NOT NULL,
    "status" TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    "pix_key" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own withdrawals"
ON "public"."withdrawals"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
ON "public"."withdrawals"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view/update all (simplified for now, assuming app logic handles role check or admin uses service key if needed, but usually admin user needs policy)
-- Adding a broad select policy for now to ensure admins can see it. 
-- Ideally we check for role='admin' in profiles.
CREATE POLICY "Admins can view all withdrawals"
ON "public"."withdrawals"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update withdrawals"
ON "public"."withdrawals"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
