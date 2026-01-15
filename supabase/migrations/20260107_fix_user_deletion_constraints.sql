-- Fix Foreign Key Constraints to allow User Deletion
-- This script changes the foreign keys to ON DELETE CASCADE so that when a user is deleted, 
-- their related data (notifications, etc.) is also automatically deleted instead of blocking the deletion.

-- 1. Fix Notifications
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Fix Withdrawals (Saques) - just in case
ALTER TABLE public.withdrawals
DROP CONSTRAINT IF EXISTS withdrawals_user_id_fkey;

ALTER TABLE public.withdrawals
ADD CONSTRAINT withdrawals_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. Fix Orders (if needed, usually already CASCADE but good to ensure)
-- Note: Orders usually reference profiles, but sometimes auth.users. 
-- Assuming profiles based on previous files.
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 4. Fix Products (if users own products)
-- Check if products has user_id or affiliate_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id') THEN
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_user_id_fkey;
        ALTER TABLE public.products ADD CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
