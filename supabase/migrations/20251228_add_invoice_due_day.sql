-- Add invoice_due_day column to profiles table

ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "invoice_due_day" INTEGER DEFAULT 30;

COMMENT ON COLUMN "public"."profiles"."invoice_due_day" IS 'Day of the month when invoices are due (1-31)';
