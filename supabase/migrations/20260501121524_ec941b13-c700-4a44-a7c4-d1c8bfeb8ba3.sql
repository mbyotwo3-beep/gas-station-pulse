CREATE TABLE public.order_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  rated_by UUID NOT NULL,
  rated_user UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (order_id, rated_by)
);

ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings for their orders"
ON public.order_ratings
FOR SELECT
USING (rated_by = auth.uid() OR rated_user = auth.uid());

CREATE POLICY "Customers can rate delivered orders"
ON public.order_ratings
FOR INSERT
WITH CHECK (
  auth.uid() = rated_by
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_ratings.order_id
      AND o.customer_id = auth.uid()
      AND o.status = 'delivered'
      AND o.driver_id = order_ratings.rated_user
  )
);

CREATE INDEX idx_order_ratings_order ON public.order_ratings(order_id);
CREATE INDEX idx_order_ratings_rated_user ON public.order_ratings(rated_user);