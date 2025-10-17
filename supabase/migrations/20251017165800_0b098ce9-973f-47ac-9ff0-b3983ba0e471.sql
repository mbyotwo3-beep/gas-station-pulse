-- Create payments table
CREATE TABLE public.ride_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'wallet')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(ride_id)
);

-- Enable RLS on ride_payments
ALTER TABLE public.ride_payments ENABLE ROW LEVEL SECURITY;

-- Ride payments policies
CREATE POLICY "Users can view their ride payments"
ON public.ride_payments FOR SELECT
USING (
  payer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = ride_id 
    AND driver_id = auth.uid()
  )
);

CREATE POLICY "Passengers can create payments for their rides"
ON public.ride_payments FOR INSERT
WITH CHECK (
  auth.uid() = payer_id
  AND EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = ride_id 
    AND passenger_id = auth.uid()
    AND status = 'completed'
  )
);

CREATE POLICY "Users can update their own payments"
ON public.ride_payments FOR UPDATE
USING (payer_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = ride_id 
    AND driver_id = auth.uid()
  )
);

-- Create ride messages table for chat
CREATE TABLE public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on ride_messages
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- Ride messages policies
CREATE POLICY "Users can view messages for their rides"
ON public.ride_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = ride_id 
    AND (driver_id = auth.uid() OR passenger_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages for their rides"
ON public.ride_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = ride_id 
    AND (driver_id = auth.uid() OR passenger_id = auth.uid())
    AND status IN ('accepted', 'in_progress')
  )
);

CREATE POLICY "Users can update their own messages"
ON public.ride_messages FOR UPDATE
USING (sender_id = auth.uid());

-- Add indexes
CREATE INDEX idx_ride_payments_ride_id ON public.ride_payments(ride_id);
CREATE INDEX idx_ride_payments_payer_id ON public.ride_payments(payer_id);
CREATE INDEX idx_ride_messages_ride_id ON public.ride_messages(ride_id);
CREATE INDEX idx_ride_messages_sender_id ON public.ride_messages(sender_id);

-- Enable realtime
ALTER TABLE public.ride_payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_payments;
ALTER TABLE public.ride_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;