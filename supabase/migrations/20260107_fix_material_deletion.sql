-- Fix Material Deletion Constraint
-- Allow deleting materials by setting product.material_id to NULL instead of blocking

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_material_id_fkey;

ALTER TABLE public.products
ADD CONSTRAINT products_material_id_fkey
FOREIGN KEY (material_id)
REFERENCES public.materials(id)
ON DELETE SET NULL;
