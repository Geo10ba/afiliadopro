-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    rate DECIMAL(5, 2) NOT NULL DEFAULT 0.10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add total_earnings to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_earnings') THEN
        ALTER TABLE profiles ADD COLUMN total_earnings DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- Enable RLS on commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own commissions
CREATE POLICY "Users can view their own commissions" ON commissions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all commissions (assuming admin check via profile role or similar)
-- For simplicity, we'll stick to the basic user policy for now, admins usually bypass RLS or have specific policies.
-- Let's add a policy for admins if we have a way to identify them in RLS, otherwise the service role (used in Edge Functions) or app logic will handle it.
-- Assuming 'admin' role in profiles:
CREATE POLICY "Admins can view all commissions" ON commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
