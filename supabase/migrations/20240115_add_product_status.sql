-- Add status column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing products to 'approved' so they don't disappear or look pending
UPDATE products SET status = 'approved' WHERE status IS NULL;

-- Policy: Admins can update products (specifically status and commission_rate)
-- Check if policy already exists or create a new one
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' 
        AND policyname = 'Admins can update products'
    ) THEN
        CREATE POLICY "Admins can update products"
        ON products FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;
END
$$;
