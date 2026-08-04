-- Consolidated schema migration for new Lovable Cloud backend
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE public.app_role AS ENUM ('user', 'driver', 'manager', 'admin', 'passenger');

CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  avatar_url text,
  preferences jsonb DEFAULT '{"notifications": true, "favorite_stations": []}'::jsonb,
  primary_role public.app_role DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.stations (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  brand text,
  photos jsonb DEFAULT '[]'::jsonb,
  fuel_prices jsonb DEFAULT '{}'::jsonb,
  fuel_types jsonb DEFAULT '[]'::jsonb,
  amenities jsonb DEFAULT '[]'::jsonb,
  operating_hours jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'available' CHECK (status IN ('available', 'low', 'out', 'unknown')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.station_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id text NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  station_name text,
  status text NOT NULL CHECK (status IN ('available', 'low', 'out')),
  note text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.station_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id text NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.station_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id text NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  type text DEFAULT 'favorite',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_location jsonb NOT NULL,
  end_location jsonb NOT NULL,
  waypoints jsonb DEFAULT '[]'::jsonb,
  distance numeric,
  duration numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.driver_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'van', 'truck')),
  vehicle_make text,
  vehicle_model text,
  license_plate text,
  is_active boolean NOT NULL DEFAULT false,
  current_location jsonb,
  rating numeric DEFAULT 5.0,
  total_rides integer DEFAULT 0,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  passenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_location jsonb NOT NULL,
  destination_location jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  fare_amount numeric,
  fare_breakdown jsonb,
  estimated_duration integer,
  estimated_distance numeric,
  driver_notes text,
  passenger_notes text,
  otp_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE TABLE public.ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_location jsonb NOT NULL,
  destination_location jsonb NOT NULL,
  max_fare numeric,
  passenger_count integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour')
);

CREATE TABLE public.ride_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ride_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  tip_amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'wallet',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ride_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ride_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  cancelled_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  role text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ride_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  address text,
  lat numeric,
  lng numeric,
  phone text,
  email text,
  cuisine_type text,
  is_active boolean NOT NULL DEFAULT true,
  opening_hours jsonb DEFAULT '{}'::jsonb,
  delivery_fee numeric DEFAULT 0,
  minimum_order numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  service_type text NOT NULL DEFAULT 'food' CHECK (service_type IN ('food', 'package', 'errand')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'picking_up', 'in_transit', 'delivered', 'completed', 'cancelled')),
  items jsonb DEFAULT '[]'::jsonb,
  pickup_location jsonb,
  delivery_location jsonb,
  subtotal numeric DEFAULT 0,
  delivery_fee numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  payment_method text DEFAULT 'wallet',
  payment_status text DEFAULT 'pending',
  notes text,
  estimated_delivery_time timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.order_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.driver_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ride_id uuid REFERENCES public.rides(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZMW',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'refund')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'ZMW',
  description text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id uuid,
  service_type text,
  service_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'ZMW',
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, primary_role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data ->> 'primary_role')::public.app_role, 'user')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'primary_role')::public.app_role, 'user')
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_auth_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS public.app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(role)
  FROM public.user_roles
  WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_safe_profile(_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, primary_role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.primary_role
  FROM public.profiles p
  WHERE p.id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_safe_driver_profile(_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  vehicle_type text,
  vehicle_make text,
  vehicle_model text,
  license_plate text,
  is_active boolean,
  current_location jsonb,
  rating numeric,
  total_rides integer,
  verification_status text,
  verified_at timestamp with time zone,
  verified_by uuid
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
    dp.is_active,
    dp.current_location,
    dp.rating,
    dp.total_rides,
    dp.verification_status,
    dp.verified_at,
    dp.verified_by
  FROM public.driver_profiles dp
  WHERE dp.user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.assign_additional_role(
  p_user_id uuid,
  p_role public.app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_wallet_funds(
  p_user_id uuid,
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, description, status)
  VALUES (p_user_id, 'debit', p_amount, v_wallet.currency, 'Ride/service payment', 'completed');

  RETURN true;
END;
$$;

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
  v_from_wallet public.wallets%ROWTYPE;
  v_to_wallet public.wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_from_wallet FROM public.wallets WHERE user_id = p_from_user_id FOR UPDATE;
  SELECT * INTO v_to_wallet FROM public.wallets WHERE user_id = p_to_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;
  IF v_from_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.wallets SET balance = balance - p_amount, updated_at = now() WHERE user_id = p_from_user_id;
  UPDATE public.wallets SET balance = balance + p_amount, updated_at = now() WHERE user_id = p_to_user_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, description, status)
  VALUES (p_from_user_id, 'transfer', p_amount, v_from_wallet.currency, COALESCE(p_description, 'P2P transfer'), 'completed');

  INSERT INTO public.transactions (user_id, type, amount, currency, description, status)
  VALUES (p_to_user_id, 'transfer', p_amount, v_to_wallet.currency, COALESCE(p_description, 'P2P transfer'), 'completed');

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_wallet_funds(
  p_user_id uuid,
  p_amount numeric,
  p_transaction_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (p_user_id, p_amount, 'ZMW')
    RETURNING * INTO v_wallet;
  ELSE
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, currency, description, status, reference_id)
  VALUES (p_user_id, 'credit', p_amount, v_wallet.currency, 'Wallet top-up', 'completed', p_transaction_id);

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_service_payment(
  p_user_id uuid,
  p_amount numeric,
  p_service_type text,
  p_service_id uuid,
  p_reference_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
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

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_nearest_runner(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_order_lat numeric;
  v_order_lng numeric;
  v_runner public.driver_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.driver_id IS NOT NULL THEN
    RETURN false;
  END IF;

  v_order_lat := (v_order.pickup_location ->> 'lat')::numeric;
  v_order_lng := (v_order.pickup_location ->> 'lng')::numeric;

  SELECT dp.* INTO v_runner
  FROM public.driver_profiles dp
  WHERE dp.is_active = true
    AND dp.verification_status = 'approved'
    AND dp.current_location IS NOT NULL
  ORDER BY public.calculate_distance(
    v_order_lat,
    v_order_lng,
    (dp.current_location ->> 'lat')::numeric,
    (dp.current_location ->> 'lng')::numeric
  )
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.orders
  SET driver_id = v_runner.user_id,
      status = 'accepted',
      updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric
)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT 6371 * acos(
    least(greatest(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) + sin(radians(lat1)) * sin(radians(lat2)), -1), 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'ZMW')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_ride_payment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.transactions
      WHERE user_id = NEW.payer_id
        AND service_type = 'ride'
        AND service_id = NEW.ride_id
        AND status = 'completed'
        AND type = 'debit'
    ) THEN
      RAISE EXCEPTION 'Ride payment can only be marked completed after a verified wallet debit transaction';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Stations are viewable by everyone" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create stations" ON public.stations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Station managers and admins can update stations" ON public.stations FOR UPDATE USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Station reports are viewable by everyone" ON public.station_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON public.station_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reports" ON public.station_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Station reviews are viewable by everyone" ON public.station_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.station_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.station_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Station photos are viewable by everyone" ON public.station_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create photos" ON public.station_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved locations" ON public.saved_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saved locations" ON public.saved_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved locations" ON public.saved_locations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved routes" ON public.saved_routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saved routes" ON public.saved_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved routes" ON public.saved_routes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Driver profiles are viewable by everyone" ON public.driver_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own driver profile" ON public.driver_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own driver profile" ON public.driver_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update driver profiles" ON public.driver_profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own rides" ON public.rides FOR SELECT USING (auth.uid() = driver_id OR auth.uid() = passenger_id);
CREATE POLICY "Drivers can create rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Users can update their own rides" ON public.rides FOR UPDATE USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

CREATE POLICY "Ride requests are viewable by everyone" ON public.ride_requests FOR SELECT USING (true);
CREATE POLICY "Users can create their own ride requests" ON public.ride_requests FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Users can update their own ride requests" ON public.ride_requests FOR UPDATE USING (auth.uid() = passenger_id);

CREATE POLICY "Ride participants can view ratings" ON public.ride_ratings FOR SELECT USING (auth.uid() = rater_id OR auth.uid() = ratee_id);
CREATE POLICY "Users can create their own ratings" ON public.ride_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Ride participants can view payments" ON public.ride_payments FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);
CREATE POLICY "Users can create their own payments" ON public.ride_payments FOR INSERT WITH CHECK (auth.uid() = payer_id);
CREATE POLICY "Users can update their own payments" ON public.ride_payments FOR UPDATE USING (auth.uid() = payer_id);

CREATE POLICY "Ride participants can view messages" ON public.ride_messages FOR SELECT USING (auth.uid() IN (
  SELECT driver_id FROM public.rides WHERE id = ride_id
  UNION
  SELECT passenger_id FROM public.rides WHERE id = ride_id
));
CREATE POLICY "Ride participants can send messages" ON public.ride_messages FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT driver_id FROM public.rides WHERE id = ride_id
  UNION
  SELECT passenger_id FROM public.rides WHERE id = ride_id
));

CREATE POLICY "Ride participants can view cancellations" ON public.ride_cancellations FOR SELECT USING (auth.uid() = cancelled_by);
CREATE POLICY "Users can create their own cancellations" ON public.ride_cancellations FOR INSERT WITH CHECK (auth.uid() = cancelled_by);

CREATE POLICY "Users can view their own disputes" ON public.ride_disputes FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all disputes" ON public.ride_disputes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own disputes" ON public.ride_disputes FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Restaurants are viewable by everyone" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create restaurants" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Restaurant owners and managers can update" ON public.restaurants FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Restaurant owners and managers can update" ON public.menu_items FOR UPDATE USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = driver_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = driver_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own order ratings" ON public.order_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ratings" ON public.order_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers can view their own earnings" ON public.driver_earnings FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can view all earnings" ON public.driver_earnings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage transactions" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their own payment requests" ON public.payment_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can create their own payment requests" ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own payment requests" ON public.payment_requests FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS create_user_wallet_trigger ON auth.users;
CREATE TRIGGER create_user_wallet_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_wallet();

DROP TRIGGER IF EXISTS set_station_reports_user_id ON public.station_reports;
CREATE TRIGGER set_station_reports_user_id
  BEFORE INSERT ON public.station_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
DROP TRIGGER IF EXISTS update_stations_updated_at ON public.stations;
DROP TRIGGER IF EXISTS update_station_reports_updated_at ON public.station_reports;
DROP TRIGGER IF EXISTS update_station_reviews_updated_at ON public.station_reviews;
DROP TRIGGER IF EXISTS update_saved_routes_updated_at ON public.saved_routes;
DROP TRIGGER IF EXISTS update_driver_profiles_updated_at ON public.driver_profiles;
DROP TRIGGER IF EXISTS update_rides_updated_at ON public.rides;
DROP TRIGGER IF EXISTS update_ride_requests_updated_at ON public.ride_requests;
DROP TRIGGER IF EXISTS update_ride_payments_updated_at ON public.ride_payments;
DROP TRIGGER IF EXISTS update_ride_disputes_updated_at ON public.ride_disputes;
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_driver_earnings_updated_at ON public.driver_earnings;
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON public.payment_requests;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_station_reports_updated_at BEFORE UPDATE ON public.station_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_station_reviews_updated_at BEFORE UPDATE ON public.station_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saved_routes_updated_at BEFORE UPDATE ON public.saved_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON public.driver_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON public.ride_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ride_payments_updated_at BEFORE UPDATE ON public.ride_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ride_disputes_updated_at BEFORE UPDATE ON public.ride_disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_driver_earnings_updated_at BEFORE UPDATE ON public.driver_earnings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS enforce_ride_payment_completion_trigger ON public.ride_payments;
CREATE TRIGGER enforce_ride_payment_completion_trigger
  BEFORE UPDATE ON public.ride_payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ride_payment_completion();

CREATE INDEX idx_stations_created_by ON public.stations(created_by);
CREATE INDEX idx_stations_location ON public.stations(lat, lng);
CREATE INDEX idx_station_reports_station_id ON public.station_reports(station_id);
CREATE INDEX idx_station_reports_user_id ON public.station_reports(user_id);
CREATE INDEX idx_station_reviews_station_id ON public.station_reviews(station_id);
CREATE INDEX idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX idx_saved_routes_user_id ON public.saved_routes(user_id);
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_passenger_id ON public.rides(passenger_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_driver_profiles_user_id ON public.driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_is_active ON public.driver_profiles(is_active);
CREATE INDEX idx_ride_requests_passenger_id ON public.ride_requests(passenger_id);
CREATE INDEX idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX idx_ride_payments_ride_id ON public.ride_payments(ride_id);
CREATE INDEX idx_ride_messages_ride_id ON public.ride_messages(ride_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_payment_requests_sender_id ON public.payment_requests(sender_id);
CREATE INDEX idx_payment_requests_recipient_id ON public.payment_requests(recipient_id);

ALTER TABLE public.station_reports REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.driver_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.station_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.station_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.station_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.station_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_routes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rides TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_cancellations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_disputes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_earnings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_requests TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.stations TO service_role;
GRANT ALL ON public.station_reports TO service_role;
GRANT ALL ON public.station_reviews TO service_role;
GRANT ALL ON public.station_photos TO service_role;
GRANT ALL ON public.saved_locations TO service_role;
GRANT ALL ON public.saved_routes TO service_role;
GRANT ALL ON public.driver_profiles TO service_role;
GRANT ALL ON public.rides TO service_role;
GRANT ALL ON public.ride_requests TO service_role;
GRANT ALL ON public.ride_ratings TO service_role;
GRANT ALL ON public.ride_payments TO service_role;
GRANT ALL ON public.ride_messages TO service_role;
GRANT ALL ON public.ride_cancellations TO service_role;
GRANT ALL ON public.ride_disputes TO service_role;
GRANT ALL ON public.restaurants TO service_role;
GRANT ALL ON public.menu_items TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_ratings TO service_role;
GRANT ALL ON public.driver_earnings TO service_role;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.payment_requests TO service_role;

GRANT SELECT ON public.stations TO anon;
GRANT SELECT ON public.station_reports TO anon;
GRANT SELECT ON public.station_reviews TO anon;
GRANT SELECT ON public.station_photos TO anon;
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT ON public.menu_items TO anon;

GRANT EXECUTE ON FUNCTION public.assign_additional_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_funds(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_wallet_funds(uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_driver_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_distance(numeric, numeric, numeric, numeric) TO authenticated;

GRANT EXECUTE ON FUNCTION public.add_wallet_funds(uuid, numeric, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_service_payment(uuid, numeric, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_nearest_runner(uuid) TO service_role;
