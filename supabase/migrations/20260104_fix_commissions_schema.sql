-- Fix commissions table schema

DO $$
BEGIN
    -- 1. Rename user_id to affiliate_id if it exists (legacy schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'user_id') THEN
        ALTER TABLE public.commissions RENAME COLUMN user_id TO affiliate_id;
    END IF;
END $$;

-- 2. Ensure affiliate_id column exists (if it wasn't renamed)
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS affiliate_id UUID;

-- 3. Fix Foreign Key constraints
-- Drop potential old constraints to ensure clean slate
ALTER TABLE public.commissions 
    DROP CONSTRAINT IF EXISTS commissions_user_id_fkey,
    DROP CONSTRAINT IF EXISTS commissions_affiliate_id_fkey;

-- Add the correct constraint
ALTER TABLE public.commissions
    ADD CONSTRAINT commissions_affiliate_id_fkey 
    FOREIGN KEY (affiliate_id) 
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- 4. Ensure other columns exist
ALTER TABLE public.commissions
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rate DECIMAL(5, 2) NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Comments
COMMENT ON COLUMN public.commissions.affiliate_id IS 'Reference to the affiliate profile';
