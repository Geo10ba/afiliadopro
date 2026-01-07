-- Create a function to allow affiliates to pay their own invoices
CREATE OR REPLACE FUNCTION pay_invoice(order_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the order belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM orders
    WHERE id = order_uuid
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  -- Update the order status to 'paid'
  UPDATE orders
  SET status = 'paid'
  WHERE id = order_uuid;
END;
$$;
