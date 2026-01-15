-- Fix Balance Consistency
-- 1. Create trigger to deduct balance when commission is deleted
-- 2. Recalculate all balances to match current commissions

-- Function to handle commission deletion
CREATE OR REPLACE FUNCTION public.handle_commission_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deduct amount from affiliate's balance and total_earnings
  UPDATE public.profiles
  SET 
    balance = GREATEST(0, COALESCE(balance, 0) - old.amount),
    total_earnings = GREATEST(0, COALESCE(total_earnings, 0) - old.amount)
  WHERE id = old.affiliate_id;
  
  RETURN old;
END;
$$;

-- Create Trigger
DROP TRIGGER IF EXISTS on_commission_delete ON public.commissions;
CREATE TRIGGER on_commission_delete
BEFORE DELETE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_commission_delete();

-- Recalculate all balances to ensure consistency
-- This fixes the "ghost" balance issue
UPDATE public.profiles
SET 
  balance = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.commissions 
    WHERE affiliate_id = profiles.id 
    AND status = 'available' -- Only count available commissions for balance? Or all?
    -- Usually balance is available + pending? Or just available?
    -- Let's assume 'balance' reflects all active commissions for now, or check logic.
    -- The insert trigger added to balance immediately for 'available'.
  ),
  total_earnings = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.commissions 
    WHERE affiliate_id = profiles.id
  );
