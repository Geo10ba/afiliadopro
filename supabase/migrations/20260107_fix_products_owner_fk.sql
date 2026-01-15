-- Drop the existing strict foreign key constraint
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_owner_id_fkey;

-- Add the new constraint with ON DELETE SET NULL
-- This allows the user (owner) to be deleted, setting the product's owner_id to NULL
ALTER TABLE public.products
ADD CONSTRAINT products_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
