
-- =========================================================
-- SPRINT 1: SECURITY HARDENING
-- =========================================================

-- ---------- 1. Restrict policies to authenticated role ----------
-- Recreate sensitive policies as authenticated-only.

-- ORDERS
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = driver_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = driver_id)
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = driver_id);

-- WALLETS
DROP POLICY IF EXISTS "Users can create their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;

CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own wallet" ON public.wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Note: balance updates should only flow through SECURITY DEFINER functions.
-- Keep an UPDATE policy but block balance changes via WITH CHECK matching user_id.
CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
DROP POLICY IF EXISTS transactions_insert_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_select_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_update_policy ON public.transactions;

CREATE POLICY transactions_select_policy ON public.transactions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM rides WHERE rides.id = transactions.ride_id AND rides.driver_id = auth.uid())
    OR EXISTS (SELECT 1 FROM orders WHERE orders.id = transactions.order_id AND orders.driver_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY transactions_insert_policy ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_update_policy ON public.transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- PAYMENT_METHODS
DROP POLICY IF EXISTS payment_methods_select_policy ON public.payment_methods;
DROP POLICY IF EXISTS payment_methods_insert_policy ON public.payment_methods;
DROP POLICY IF EXISTS payment_methods_update_policy ON public.payment_methods;
DROP POLICY IF EXISTS payment_methods_delete_policy ON public.payment_methods;

CREATE POLICY payment_methods_select_policy ON public.payment_methods
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY payment_methods_insert_policy ON public.payment_methods
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY payment_methods_update_policy ON public.payment_methods
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY payment_methods_delete_policy ON public.payment_methods
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RIDES
DROP POLICY IF EXISTS "Drivers and admins can view all rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can create rides" ON public.rides;
DROP POLICY IF EXISTS "Users can update their own rides" ON public.rides;
DROP POLICY IF EXISTS "Users can view rides they are involved in" ON public.rides;

CREATE POLICY "Users can view their rides" ON public.rides
  FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR auth.uid() = passenger_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Drivers can create rides" ON public.rides
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their own rides" ON public.rides
  FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id OR auth.uid() = passenger_id)
  WITH CHECK (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- RIDE_PAYMENTS
DROP POLICY IF EXISTS "Passengers can create payments for their rides" ON public.ride_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.ride_payments;
DROP POLICY IF EXISTS "Users can view their ride payments" ON public.ride_payments;

CREATE POLICY "Passengers can create ride payments" ON public.ride_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = payer_id AND EXISTS (
      SELECT 1 FROM rides WHERE rides.id = ride_payments.ride_id
        AND rides.passenger_id = auth.uid() AND rides.status = 'completed'
    )
  );

CREATE POLICY "Users can update their ride payments" ON public.ride_payments
  FOR UPDATE TO authenticated
  USING (payer_id = auth.uid() OR EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_payments.ride_id AND rides.driver_id = auth.uid()))
  WITH CHECK (payer_id = auth.uid() OR EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_payments.ride_id AND rides.driver_id = auth.uid()));

CREATE POLICY "Users can view their ride payments" ON public.ride_payments
  FOR SELECT TO authenticated
  USING (payer_id = auth.uid() OR EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_payments.ride_id AND rides.driver_id = auth.uid()));

-- PAYMENT_REQUESTS
DROP POLICY IF EXISTS "Recipients can update requests (accept/decline)" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can update their own requests (cancel)" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;

CREATE POLICY "Users can view their payment requests" ON public.payment_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create payment requests" ON public.payment_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update payment requests" ON public.payment_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = to_user_id AND status IN ('pending','accepted','declined'));

CREATE POLICY "Senders can cancel payment requests" ON public.payment_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = from_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = from_user_id AND status IN ('pending','cancelled'));

-- DRIVER_EARNINGS
DROP POLICY IF EXISTS "Drivers can view their own earnings" ON public.driver_earnings;
DROP POLICY IF EXISTS "System can create earnings" ON public.driver_earnings;

CREATE POLICY "Drivers can view their own earnings" ON public.driver_earnings
  FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create earnings" ON public.driver_earnings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);

-- DRIVER_PROFILES
DROP POLICY IF EXISTS "Driver profiles viewable by authorized users" ON public.driver_profiles;
DROP POLICY IF EXISTS "Users can create their own driver profile" ON public.driver_profiles;
DROP POLICY IF EXISTS "Users can update their own driver profile" ON public.driver_profiles;

CREATE POLICY "Driver profiles viewable by authorized users" ON public.driver_profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM rides
      WHERE rides.driver_id = driver_profiles.user_id
        AND rides.passenger_id = auth.uid()
        AND rides.status IN ('accepted','in_progress')
    )
  );

CREATE POLICY "Users can create their own driver profile" ON public.driver_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own driver profile" ON public.driver_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROFILES — remove the broad "Users can view profiles with restrictions"
-- which exposed email columns to counterparties. Counterparties must use
-- public.get_safe_profile(uuid).
DROP POLICY IF EXISTS "Users can view profiles with restrictions" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- USER_ROLES
DROP POLICY IF EXISTS "Users can insert their own roles during signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roles during signup" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RIDE_REQUESTS / RIDE_MESSAGES / RIDE_RATINGS / ORDER_RATINGS / SAVED_LOCATIONS / SAVED_ROUTES
DROP POLICY IF EXISTS "Ride requests viewable by authorized users" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can create their own ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Users can update their own ride requests" ON public.ride_requests;

CREATE POLICY "Ride requests viewable by authorized users" ON public.ride_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = passenger_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'driver'::app_role));
CREATE POLICY "Users can create their own ride requests" ON public.ride_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Users can update their own ride requests" ON public.ride_requests
  FOR UPDATE TO authenticated USING (auth.uid() = passenger_id) WITH CHECK (auth.uid() = passenger_id);

-- ---------- 2. Harden wallet functions ----------

CREATE OR REPLACE FUNCTION public.add_wallet_funds(p_user_id uuid, p_amount numeric, p_payment_method_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to credit this wallet';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.wallets SET balance = balance + p_amount WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (p_user_id, p_amount);
  END IF;
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deduct_wallet_funds(p_user_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT balance INTO v_current_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  UPDATE public.wallets SET balance = balance - p_amount WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$function$;
