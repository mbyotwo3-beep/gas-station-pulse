-- Create payment requests table
CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  completed_at timestamp with time zone,
  CONSTRAINT no_self_requests CHECK (from_user_id != to_user_id)
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payment requests"
ON public.payment_requests
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their own requests (cancel)"
ON public.payment_requests
FOR UPDATE
USING (auth.uid() = from_user_id AND status = 'pending')
WITH CHECK (auth.uid() = from_user_id AND status IN ('pending', 'cancelled'));

CREATE POLICY "Recipients can update requests (accept/decline)"
ON public.payment_requests
FOR UPDATE
USING (auth.uid() = to_user_id AND status = 'pending')
WITH CHECK (auth.uid() = to_user_id AND status IN ('pending', 'accepted', 'declined'));

-- Create trigger for updated_at
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_payment_requests_from_user ON public.payment_requests(from_user_id);
CREATE INDEX idx_payment_requests_to_user ON public.payment_requests(to_user_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;