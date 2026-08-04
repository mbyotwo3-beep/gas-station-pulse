-- 1. Wallet ownership checks
CREATE OR REPLACE FUNCTION public.deduct_wallet_funds(p_user_id uuid, p_amount numeric)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF v_wallet.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.wallets SET balance = balance - p_amount, updated_at = now() WHERE user_id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, description, status)
  VALUES (p_user_id, 'debit', p_amount, v_wallet.currency, 'Ride/service payment', 'completed');
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.transfer_wallet_funds(p_from_user_id uuid, p_to_user_id uuid, p_amount numeric, p_description text DEFAULT NULL::text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_from_wallet public.wallets%ROWTYPE;
  v_to_wallet public.wallets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_from_user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_to_user_id IS NULL OR p_to_user_id = p_from_user_id THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT * INTO v_from_wallet FROM public.wallets WHERE user_id = p_from_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sender wallet not found'; END IF;
  SELECT * INTO v_to_wallet FROM public.wallets WHERE user_id = p_to_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recipient wallet not found'; END IF;
  IF v_from_wallet.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.wallets SET balance = balance - p_amount, updated_at = now() WHERE user_id = p_from_user_id;
  UPDATE public.wallets SET balance = balance + p_amount, updated_at = now() WHERE user_id = p_to_user_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, description, status)
  VALUES (p_from_user_id, 'transfer', p_amount, v_from_wallet.currency, COALESCE(p_description, 'P2P transfer'), 'completed');
  INSERT INTO public.transactions (user_id, type, amount, currency, description, status)
  VALUES (p_to_user_id, 'transfer', p_amount, v_to_wallet.currency, COALESCE(p_description, 'P2P transfer'), 'completed');
  RETURN true;
END;
$function$;

-- 2. Role self-grant
CREATE OR REPLACE FUNCTION public.assign_additional_role(p_user_id uuid, p_role app_role)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_role IN ('admin', 'manager') THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
  ELSIF auth.uid() IS DISTINCT FROM p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$function$;

DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own safe roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('user','passenger','driver'));

-- 3. Profiles email exposure
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 4. Ride cancellations visibility
DROP POLICY IF EXISTS "Ride participants can view cancellations" ON public.ride_cancellations;
CREATE POLICY "Ride participants can view cancellations"
ON public.ride_cancellations FOR SELECT TO authenticated
USING (
  auth.uid() = cancelled_by
  OR EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = ride_cancellations.ride_id
      AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid())
  )
);

-- 5. Function search path
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
 RETURNS numeric LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  SELECT 6371 * acos(
    least(greatest(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) + sin(radians(lat1)) * sin(radians(lat2)), -1), 1)
  );
$function$;