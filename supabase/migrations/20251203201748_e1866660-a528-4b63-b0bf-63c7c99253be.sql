-- Secure wallet transfer function to ensure users can only transfer from their own wallet (or admin)
CREATE OR REPLACE FUNCTION public.transfer_wallet_funds(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_balance NUMERIC;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure caller owns the source wallet or is admin
  IF auth.uid() <> p_from_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to transfer from this wallet';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;
  
  -- Validate not transferring to self
  IF p_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;
  
  -- Check sender balance and lock the row
  SELECT balance INTO v_from_balance
  FROM public.wallets
  WHERE user_id = p_from_user_id
  FOR UPDATE;
  
  IF v_from_balance IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;
  
  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Check receiver wallet exists
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = p_to_user_id) THEN
    -- Create wallet for receiver if it doesn't exist
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_to_user_id, 0);
  END IF;
  
  -- Deduct from sender
  UPDATE public.wallets
  SET balance = balance - p_amount
  WHERE user_id = p_from_user_id;
  
  -- Add to receiver
  UPDATE public.wallets
  SET balance = balance + p_amount
  WHERE user_id = p_to_user_id;
  
  -- Create transaction record for sender (debit)
  INSERT INTO public.transactions (
    user_id,
    transaction_type,
    service_type,
    amount,
    currency,
    status,
    description,
    completed_at,
    metadata
  ) VALUES (
    p_from_user_id,
    'transfer_out',
    'ride',
    p_amount,
    'USD',
    'completed',
    COALESCE(p_description, 'Transfer to user'),
    now(),
    jsonb_build_object('recipient_id', p_to_user_id)
  );
  
  -- Create transaction record for receiver (credit)
  INSERT INTO public.transactions (
    user_id,
    transaction_type,
    service_type,
    amount,
    currency,
    status,
    description,
    completed_at,
    metadata
  ) VALUES (
    p_to_user_id,
    'transfer_in',
    'ride',
    p_amount,
    'USD',
    'completed',
    COALESCE(p_description, 'Transfer from user'),
    now(),
    jsonb_build_object('sender_id', p_from_user_id)
  );
  
  RETURN TRUE;
END;
$$;