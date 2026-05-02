
CREATE OR REPLACE FUNCTION public.assign_nearest_runner(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup jsonb;
  v_lat double precision;
  v_lng double precision;
  v_runner uuid;
  v_customer uuid;
BEGIN
  SELECT pickup_location, customer_id INTO v_pickup, v_customer
  FROM public.orders WHERE id = p_order_id;

  IF v_pickup IS NULL THEN RETURN NULL; END IF;

  v_lat := (v_pickup->>'lat')::double precision;
  v_lng := (v_pickup->>'lng')::double precision;

  -- pick closest verified, active driver who isn't on an active order/ride
  SELECT dp.user_id INTO v_runner
  FROM public.driver_profiles dp
  WHERE dp.is_active = true
    AND dp.verification_status = 'approved'
    AND dp.current_location IS NOT NULL
    AND dp.user_id <> v_customer
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.driver_id = dp.user_id
        AND o.status IN ('accepted','picking_up','in_transit')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.driver_id = dp.user_id
        AND r.status IN ('accepted','in_progress')
    )
  ORDER BY (
    power(((dp.current_location->>'lat')::double precision) - v_lat, 2) +
    power(((dp.current_location->>'lng')::double precision) - v_lng, 2)
  ) ASC
  LIMIT 1;

  IF v_runner IS NOT NULL THEN
    UPDATE public.orders
    SET driver_id = v_runner, status = 'accepted', updated_at = now()
    WHERE id = p_order_id AND status = 'pending';
  END IF;

  RETURN v_runner;
END;
$$;
