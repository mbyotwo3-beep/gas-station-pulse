-- 1. PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Driver geospatial column + trust flags
ALTER TABLE public.driver_profiles
  ADD COLUMN IF NOT EXISTS geo geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS driver_profiles_geo_idx ON public.driver_profiles USING gist(geo);

CREATE OR REPLACE FUNCTION public.sync_driver_geo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.current_location IS NOT NULL
     AND (NEW.current_location ->> 'lat') IS NOT NULL
     AND (NEW.current_location ->> 'lng') IS NOT NULL THEN
    NEW.geo := ST_SetSRID(ST_MakePoint(
      (NEW.current_location ->> 'lng')::double precision,
      (NEW.current_location ->> 'lat')::double precision
    ), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_driver_geo_trigger ON public.driver_profiles;
CREATE TRIGGER sync_driver_geo_trigger
BEFORE INSERT OR UPDATE OF current_location ON public.driver_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_driver_geo();

UPDATE public.driver_profiles
SET current_location = current_location
WHERE current_location IS NOT NULL;

-- 3. Radius search: only verified, active, non-suspended drivers
CREATE OR REPLACE FUNCTION public.get_drivers_in_radius(
  p_lng double precision,
  p_lat double precision,
  p_radius_meters double precision DEFAULT 10000,
  p_vehicle_type text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  vehicle_type text,
  vehicle_make text,
  vehicle_model text,
  license_plate text,
  rating numeric,
  total_rides integer,
  distance_meters double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dp.user_id,
    dp.vehicle_type,
    dp.vehicle_make,
    dp.vehicle_model,
    dp.license_plate,
    dp.rating,
    dp.total_rides,
    ST_Distance(dp.geo, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_meters
  FROM public.driver_profiles dp
  WHERE dp.geo IS NOT NULL
    AND dp.is_active = true
    AND dp.is_suspended = false
    AND dp.verification_status = 'approved'
    AND (p_vehicle_type IS NULL OR dp.vehicle_type = p_vehicle_type)
    AND ST_DWithin(dp.geo, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
  ORDER BY distance_meters
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.get_drivers_in_radius(double precision, double precision, double precision, text) TO authenticated, service_role;

-- 4. Auto-assignment now uses vetted drivers only
CREATE OR REPLACE FUNCTION public.assign_nearest_runner(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_lat double precision;
  v_lng double precision;
  v_runner uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.driver_id IS NOT NULL THEN
    RETURN false;
  END IF;

  v_lat := (v_order.pickup_location ->> 'lat')::double precision;
  v_lng := (v_order.pickup_location ->> 'lng')::double precision;
  IF v_lat IS NULL OR v_lng IS NULL THEN
    RETURN false;
  END IF;

  SELECT d.user_id INTO v_runner
  FROM public.get_drivers_in_radius(v_lng, v_lat, 25000) d
  LIMIT 1;

  IF v_runner IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.orders
  SET driver_id = v_runner,
      status = 'accepted',
      updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$$;

-- 5. Commission columns on earnings
ALTER TABLE public.driver_earnings
  ADD COLUMN IF NOT EXISTS gross_amount numeric,
  ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 0.06,
  ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0;

UPDATE public.driver_earnings SET gross_amount = amount WHERE gross_amount IS NULL;

-- 6. Settlement writes the 6% split atomically
CREATE OR REPLACE FUNCTION public.settle_service_payment(
  p_user_id uuid,
  p_amount numeric,
  p_service_type text,
  p_service_id uuid,
  p_reference_id uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_provider uuid;
  v_rate numeric := 0.06;
  v_commission numeric;
  v_net numeric;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, description, status, reference_id, service_type, service_id)
  VALUES (p_user_id, 'debit', p_amount, v_wallet.currency, 'Service payment: ' || p_service_type, 'completed', p_reference_id, p_service_type, p_service_id);

  -- Determine the provider (driver / courier) for the commission split
  IF p_service_type = 'ride' THEN
    SELECT driver_id INTO v_provider FROM public.rides WHERE id = p_service_id;
  ELSE
    SELECT driver_id INTO v_provider FROM public.orders WHERE id = p_service_id;
  END IF;

  IF v_provider IS NOT NULL THEN
    v_commission := round(p_amount * v_rate, 2);
    v_net := p_amount - v_commission;

    INSERT INTO public.driver_earnings (
      driver_id, ride_id, order_id, amount, gross_amount,
      commission_rate, commission_amount, type, status
    )
    VALUES (
      v_provider,
      CASE WHEN p_service_type = 'ride' THEN p_service_id ELSE NULL END,
      CASE WHEN p_service_type = 'ride' THEN NULL ELSE p_service_id END,
      v_net, p_amount, v_rate, v_commission,
      p_service_type, 'completed'
    );

    UPDATE public.wallets
    SET balance = balance + v_net, updated_at = now()
    WHERE user_id = v_provider;

    INSERT INTO public.transactions (user_id, type, amount, currency, description, status, reference_id, service_type, service_id)
    VALUES (v_provider, 'credit', v_net, v_wallet.currency,
            'Earnings (' || p_service_type || ', after 6% platform fee)', 'completed', p_reference_id, p_service_type, p_service_id);
  END IF;

  RETURN true;
END;
$$;

-- 7. Driver verification documents
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('national_id','drivers_license','vehicle_registration','selfie','police_clearance','insurance')),
  file_path text NOT NULL,
  expires_on date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (driver_id, doc_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_documents TO authenticated;
GRANT ALL ON public.driver_documents TO service_role;

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers manage their own documents"
  ON public.driver_documents FOR ALL TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id AND status = 'pending');

CREATE POLICY "Admins view all documents"
  ON public.driver_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins review documents"
  ON public.driver_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_driver_documents_updated_at ON public.driver_documents;
CREATE TRIGGER update_driver_documents_updated_at
BEFORE UPDATE ON public.driver_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Admins can suspend / approve drivers; expired docs block approval
CREATE OR REPLACE FUNCTION public.set_driver_verification(
  p_driver_id uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_missing int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_status NOT IN ('pending','approved','rejected','suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF p_status = 'approved' THEN
    SELECT count(*) INTO v_missing
    FROM (VALUES ('national_id'),('drivers_license'),('vehicle_registration'),('selfie'),('police_clearance')) AS required(doc_type)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.driver_documents d
      WHERE d.driver_id = p_driver_id
        AND d.doc_type = required.doc_type
        AND d.status = 'approved'
        AND (d.expires_on IS NULL OR d.expires_on > current_date)
    );
    IF v_missing > 0 THEN
      RAISE EXCEPTION 'Driver has % missing or expired required document(s)', v_missing;
    END IF;
  END IF;

  UPDATE public.driver_profiles
  SET verification_status = CASE WHEN p_status = 'suspended' THEN 'rejected' ELSE p_status END,
      is_suspended = (p_status = 'suspended'),
      suspension_reason = CASE WHEN p_status = 'suspended' THEN p_reason ELSE NULL END,
      rejection_reason = CASE WHEN p_status = 'rejected' THEN p_reason ELSE NULL END,
      is_active = CASE WHEN p_status IN ('suspended','rejected') THEN false ELSE is_active END,
      verified_at = CASE WHEN p_status = 'approved' THEN now() ELSE NULL END,
      verified_by = auth.uid(),
      updated_at = now()
  WHERE user_id = p_driver_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_driver_verification(uuid, text, text) TO authenticated, service_role;

-- 9. Platform revenue for admins
CREATE OR REPLACE FUNCTION public.get_platform_revenue(p_since timestamptz DEFAULT now() - interval '30 days')
RETURNS TABLE (total_gross numeric, total_commission numeric, total_payouts numeric, jobs bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(sum(gross_amount), 0),
    COALESCE(sum(commission_amount), 0),
    COALESCE(sum(amount), 0),
    count(*)
  FROM public.driver_earnings
  WHERE created_at >= p_since
    AND public.has_role(auth.uid(), 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_revenue(timestamptz) TO authenticated, service_role;