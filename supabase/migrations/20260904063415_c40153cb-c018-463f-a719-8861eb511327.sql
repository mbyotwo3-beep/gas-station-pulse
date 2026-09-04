-- Order cancellations (mirrors ride_cancellations)
CREATE TABLE IF NOT EXISTS public.order_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cancelled_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_cancellations TO authenticated;
GRANT ALL ON public.order_cancellations TO service_role;
ALTER TABLE public.order_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view order cancellations"
ON public.order_cancellations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_id AND (o.customer_id = auth.uid() OR o.driver_id = auth.uid())
) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participants can cancel their order"
ON public.order_cancellations FOR INSERT TO authenticated
WITH CHECK (cancelled_by = auth.uid() AND EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_id AND (o.customer_id = auth.uid() OR o.driver_id = auth.uid())
));

-- Order disputes (mirrors ride_disputes)
CREATE TABLE IF NOT EXISTS public.order_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_disputes TO authenticated;
GRANT ALL ON public.order_disputes TO service_role;
ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters and admins can view order disputes"
ON public.order_disputes FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participants can report an order"
ON public.order_disputes FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_id AND (o.customer_id = auth.uid() OR o.driver_id = auth.uid())
));

CREATE POLICY "Admins can update order disputes"
ON public.order_disputes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_order_cancellations_order ON public.order_cancellations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_order ON public.order_disputes(order_id);

-- Restaurant owners need to see and progress orders for their restaurant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'Restaurant owners can view their orders'
  ) THEN
    CREATE POLICY "Restaurant owners can view their orders"
    ON public.orders FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'Restaurant owners can update their orders'
  ) THEN
    CREATE POLICY "Restaurant owners can update their orders"
    ON public.orders FOR UPDATE TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
    ));
  END IF;
END $$;