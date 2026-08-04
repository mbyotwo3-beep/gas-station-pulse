CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ADD COLUMN location jsonb;
ALTER TABLE public.restaurants ADD COLUMN rating numeric DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN min_order numeric DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN image_url text;

ALTER TABLE public.menu_items ADD COLUMN preparation_time integer DEFAULT 0;

ALTER TABLE public.orders ADD COLUMN special_instructions text;

ALTER TABLE public.order_ratings ADD COLUMN rated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.transactions ADD COLUMN transaction_type text DEFAULT 'other';

ALTER TABLE public.rides ADD COLUMN payment_status text DEFAULT 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
