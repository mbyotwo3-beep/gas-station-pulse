-- Create payment methods table for saved payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'digital_wallet', 'cash')),
  provider TEXT,
  last_four TEXT,
  cardholder_name TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  wallet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_expiry CHECK (
    (type = 'cash') OR 
    (type = 'digital_wallet') OR 
    (expiry_month >= 1 AND expiry_month <= 12 AND expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE))
  )
);

-- Create comprehensive transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'payout', 'fee')),
  service_type service_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_method_type TEXT,
  ride_id UUID REFERENCES public.rides(id),
  order_id UUID REFERENCES public.orders(id),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  processor_transaction_id TEXT,
  processor_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY payment_methods_select_policy
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY payment_methods_insert_policy
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY payment_methods_update_policy
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY payment_methods_delete_policy
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY transactions_select_policy
  ON public.transactions FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = transactions.ride_id 
      AND rides.driver_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = transactions.order_id 
      AND orders.driver_id = auth.uid()
    ) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY transactions_insert_policy
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_update_policy
  ON public.transactions FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin')
  );

-- Create indexes
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_default ON public.payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_ride_id ON public.transactions(ride_id);
CREATE INDEX idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Triggers
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- Function to sync transactions with ride payments
CREATE OR REPLACE FUNCTION public.sync_transaction_with_ride_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.transactions
    SET status = 'completed', completed_at = now()
    WHERE ride_id = NEW.ride_id
    AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_transaction_with_ride_payment_trigger
  AFTER UPDATE ON public.ride_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transaction_with_ride_payment();