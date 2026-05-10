
-- 1. WALLETS: drop direct UPDATE policy (use SECURITY DEFINER functions only)
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;

-- 2. USER_ROLES: drop self-insert (privilege escalation). Roles only via handle_new_user trigger or admin.
DROP POLICY IF EXISTS "Users can insert their own roles during signup" ON public.user_roles;

-- Harden assign_additional_role: only admins may assign sensitive roles
CREATE OR REPLACE FUNCTION public.assign_additional_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  -- Only admin can assign roles to anyone, including elevated roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN FALSE;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN TRUE;
END;
$$;

-- 3. TRANSACTIONS: drop direct INSERT; transactions are written via SECURITY DEFINER funcs
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;

-- Move wallet top-up / deduction transaction inserts inside the SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.add_wallet_funds(p_user_id uuid, p_amount numeric, p_payment_method_id uuid DEFAULT NULL::uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to credit this wallet';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  UPDATE public.wallets SET balance = balance + p_amount WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (p_user_id, p_amount);
  END IF;

  INSERT INTO public.transactions (
    user_id, transaction_type, service_type, amount, currency, status,
    payment_method_id, description, completed_at
  ) VALUES (
    p_user_id, 'top_up', 'ride', p_amount, 'USD', 'completed',
    p_payment_method_id, 'Wallet top-up', now()
  );
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_wallet_funds(p_user_id uuid, p_amount numeric)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_current_balance NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT balance INTO v_current_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  UPDATE public.wallets SET balance = balance - p_amount WHERE user_id = p_user_id;

  INSERT INTO public.transactions (
    user_id, transaction_type, service_type, amount, currency, status,
    payment_method_type, description, completed_at
  ) VALUES (
    p_user_id, 'payment', 'ride', p_amount, 'USD', 'completed',
    'wallet', 'Wallet payment', now()
  );
  RETURN TRUE;
END;
$$;

-- 4. DRIVER_EARNINGS: drop self-insert
DROP POLICY IF EXISTS "System can create earnings" ON public.driver_earnings;

-- 5. RIDE_REQUESTS: only verified/approved active drivers can see open ride requests
DROP POLICY IF EXISTS "Ride requests viewable by authorized users" ON public.ride_requests;
CREATE POLICY "Ride requests viewable by authorized users"
ON public.ride_requests FOR SELECT TO authenticated
USING (
  auth.uid() = passenger_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    public.has_role(auth.uid(), 'driver'::app_role)
    AND status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.verification_status = 'approved'
        AND dp.is_active = true
    )
  )
);

-- 6. STATION_REPORTS: restrict reporter visibility to authenticated users
DROP POLICY IF EXISTS "Station reports are viewable by everyone" ON public.station_reports;
CREATE POLICY "Station reports viewable by authenticated"
ON public.station_reports FOR SELECT TO authenticated
USING (true);

-- 7. DRIVER_PROFILES: stop exposing verification_documents/license_plate to passengers via row access
DROP POLICY IF EXISTS "Driver profiles viewable by authorized users" ON public.driver_profiles;
CREATE POLICY "Driver profile owners and admins"
ON public.driver_profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Safe function for passengers/others to view non-sensitive driver info
CREATE OR REPLACE FUNCTION public.get_safe_driver_profile(_driver_id uuid)
RETURNS TABLE (
  user_id uuid,
  vehicle_type text,
  vehicle_make text,
  vehicle_model text,
  is_active boolean,
  current_location jsonb,
  total_rides integer,
  rating numeric,
  verification_status text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT dp.user_id, dp.vehicle_type, dp.vehicle_make, dp.vehicle_model,
         dp.is_active, dp.current_location, dp.total_rides, dp.rating,
         dp.verification_status
  FROM public.driver_profiles dp
  WHERE dp.user_id = _driver_id
    AND (
      -- only return when caller is the driver, an admin, or has an active ride with this driver
      auth.uid() = dp.user_id
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.driver_id = dp.user_id
          AND r.passenger_id = auth.uid()
          AND r.status IN ('accepted', 'in_progress')
      )
    );
$$;

-- 8. STORAGE: revoke broad listing on public buckets (public URL access still works)
DROP POLICY IF EXISTS "Public read access for station-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view station photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 9. Revoke EXECUTE from anon on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.add_wallet_funds(uuid, numeric, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.deduct_wallet_funds(uuid, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.transfer_wallet_funds(uuid, uuid, numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.assign_additional_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.assign_nearest_runner(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_safe_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_safe_driver_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.add_wallet_funds(uuid, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_funds(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_wallet_funds(uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_additional_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_driver_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 10. Hide sensitive tables from anonymous GraphQL schema
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.wallets FROM anon;
REVOKE SELECT ON public.transactions FROM anon;
REVOKE SELECT ON public.payment_methods FROM anon;
REVOKE SELECT ON public.payment_requests FROM anon;
REVOKE SELECT ON public.driver_profiles FROM anon;
REVOKE SELECT ON public.driver_earnings FROM anon;
REVOKE SELECT ON public.ride_requests FROM anon;
REVOKE SELECT ON public.rides FROM anon;
REVOKE SELECT ON public.ride_messages FROM anon;
REVOKE SELECT ON public.ride_payments FROM anon;
REVOKE SELECT ON public.ride_ratings FROM anon;
REVOKE SELECT ON public.order_ratings FROM anon;
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.saved_locations FROM anon;
REVOKE SELECT ON public.saved_routes FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.station_reports FROM anon;
