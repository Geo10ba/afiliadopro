-- Update the check constraint for order status to include 'shipped' and 'delivered'

-- First, drop the existing constraint if it exists (the name might vary, so we try to be generic or check first)
-- Assuming the constraint name is 'orders_status_check' which is standard for Supabase
ALTER TABLE "public"."orders" DROP CONSTRAINT IF EXISTS "orders_status_check";

-- Re-add the constraint with the new values
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_status_check" 
CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'shipped', 'delivered'));

-- Comment on the column to document the values
COMMENT ON COLUMN "public"."orders"."status" IS 'Status of the order: pending, approved, rejected, paid, shipped, delivered';
