-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.materials(id),
ADD COLUMN IF NOT EXISTS width NUMERIC,
ADD COLUMN IF NOT EXISTS height NUMERIC,
ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment to explain columns
COMMENT ON COLUMN public.products.description IS 'Product description';
COMMENT ON COLUMN public.products.material_id IS 'Reference to the material used for the product';
COMMENT ON COLUMN public.products.width IS 'Width in millimeters';
COMMENT ON COLUMN public.products.height IS 'Height in millimeters';
COMMENT ON COLUMN public.products.price_type IS 'Type of pricing: fixed or meter';
COMMENT ON COLUMN public.products.base_price IS 'Base price calculated from material cost';
COMMENT ON COLUMN public.products.final_price IS 'Final selling price';
COMMENT ON COLUMN public.products.created_at IS 'Timestamp when the product was created';
COMMENT ON COLUMN public.products.updated_at IS 'Timestamp when the product was last updated';
