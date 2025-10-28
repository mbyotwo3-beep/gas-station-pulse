-- Create service types enum
CREATE TYPE service_type AS ENUM ('ride', 'food_delivery', 'package_delivery');

-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  location JSONB NOT NULL,
  cuisine_type TEXT,
  image_url TEXT,
  rating NUMERIC(3,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  operating_hours JSONB,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  min_order NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id),
  driver_id UUID,
  service_type service_type NOT NULL DEFAULT 'ride',
  pickup_location JSONB NOT NULL,
  delivery_location JSONB NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  special_instructions TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create driver earnings table
CREATE TABLE public.driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  ride_id UUID REFERENCES public.rides(id),
  order_id UUID REFERENCES public.orders(id),
  amount NUMERIC(10,2) NOT NULL,
  service_type service_type NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  paid_out_at TIMESTAMPTZ
);

-- Add service_type to rides table
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS service_type service_type DEFAULT 'ride';

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
CREATE POLICY "Restaurants are viewable by everyone"
  ON public.restaurants FOR SELECT
  USING (is_active = true OR auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can manage restaurants"
  ON public.restaurants FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for menu_items
CREATE POLICY "Menu items are viewable by everyone"
  ON public.menu_items FOR SELECT
  USING (is_available = true OR auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can manage menu items"
  ON public.menu_items FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = driver_id);

-- RLS Policies for driver_earnings
CREATE POLICY "Drivers can view their own earnings"
  ON public.driver_earnings FOR SELECT
  USING (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create earnings"
  ON public.driver_earnings FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Create indexes for better performance
CREATE INDEX idx_restaurants_location ON public.restaurants USING GIN (location);
CREATE INDEX idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_driver ON public.orders(driver_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_driver_earnings_driver ON public.driver_earnings(driver_id);

-- Create triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();