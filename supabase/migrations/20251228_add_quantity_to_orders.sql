-- Add quantity and download_link columns to orders table

ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "quantity" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "download_link" TEXT;

COMMENT ON COLUMN "public"."orders"."quantity" IS 'Quantity of items ordered';
COMMENT ON COLUMN "public"."orders"."download_link" IS 'Link for file download provided by the user';
