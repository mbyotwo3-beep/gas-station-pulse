-- Add driver verification system
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Add index for verification queries
CREATE INDEX IF NOT EXISTS idx_driver_verification_status ON public.driver_profiles(verification_status);

-- Enable realtime for driver location tracking
ALTER TABLE public.driver_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;

-- Enable realtime for rides table
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;

-- Add payment status tracking to rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed'));

-- Create function to auto-update ride payment status when payment is completed
CREATE OR REPLACE FUNCTION public.update_ride_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.rides
    SET payment_status = 'completed'
    WHERE id = NEW.ride_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for ride payment updates
DROP TRIGGER IF EXISTS on_ride_payment_completed ON public.ride_payments;
CREATE TRIGGER on_ride_payment_completed
  AFTER INSERT OR UPDATE ON public.ride_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ride_payment_status();