-- 1. Add balance columns to profiles
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "balance" DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "total_earnings" DECIMAL(10, 2) DEFAULT 0.00;

-- 2. Create commissions table
CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "affiliate_id" UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
    "order_id" UUID NOT NULL REFERENCES "public"."orders"("id") ON DELETE CASCADE,
    "amount" DECIMAL(10, 2) NOT NULL,
    "percentage" DECIMAL(5, 2) NOT NULL,
    "level" INTEGER DEFAULT 1,
    "status" TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Affiliates can view their own commissions
CREATE POLICY "Users can view own commissions" 
ON "public"."commissions" 
FOR SELECT 
TO authenticated 
USING (auth.uid() = affiliate_id);

-- Admins can view all commissions (assuming admin check logic or separate policy)
-- For now, we'll rely on the app logic or add an admin policy if needed later.
