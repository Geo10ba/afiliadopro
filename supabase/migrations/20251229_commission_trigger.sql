-- Function to process commissions when an order is paid
CREATE OR REPLACE FUNCTION public.process_order_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_user_id UUID;
  referrer_id UUID;
  commission_amount DECIMAL(10, 2);
  commission_rate DECIMAL(5, 2) := 10.00; -- 10% Commission
BEGIN
  -- Only process if status changed to 'paid' or 'approved'
  IF (new.status = 'paid' OR new.status = 'approved') AND (old.status <> 'paid' AND old.status <> 'approved') THEN
    
    -- Get the user who made the order
    order_user_id := new.user_id;
    
    -- Find their referrer
    SELECT referred_by INTO referrer_id
    FROM public.profiles
    WHERE id = order_user_id;
    
    -- If there is a referrer, calculate and award commission
    IF referrer_id IS NOT NULL THEN
      
      -- Calculate amount (10% of order total)
      commission_amount := (new.amount * commission_rate) / 100;
      
      -- Insert Commission Record
      INSERT INTO public.commissions (
        affiliate_id,
        order_id,
        amount,
        percentage,
        level,
        status
      ) VALUES (
        referrer_id,
        new.id,
        commission_amount,
        commission_rate,
        1,
        'available' -- Immediately available for now
      );
      
      -- Update Affiliate Balance
      UPDATE public.profiles
      SET 
        balance = COALESCE(balance, 0) + commission_amount,
        total_earnings = COALESCE(total_earnings, 0) + commission_amount
      WHERE id = referrer_id;
      
    END IF;
    
  END IF;
  
  RETURN new;
END;
$$;

-- Create Trigger
DROP TRIGGER IF EXISTS on_order_paid_commission ON public.orders;
CREATE TRIGGER on_order_paid_commission
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.process_order_commission();
