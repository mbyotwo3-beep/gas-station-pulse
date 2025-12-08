-- Fix PUBLIC_DATA_EXPOSURE: Restrict ride_requests SELECT access
-- Drop the overly permissive policy that exposes all ride request data
DROP POLICY IF EXISTS "Ride requests are viewable by everyone" ON public.ride_requests;

-- Create restricted policy: only passenger, admins, and active drivers can view
CREATE POLICY "Ride requests viewable by authorized users"
ON public.ride_requests FOR SELECT
USING (
  auth.uid() = passenger_id  -- Passengers can see their own requests
  OR has_role(auth.uid(), 'admin'::app_role)  -- Admins can see all
  OR has_role(auth.uid(), 'driver'::app_role)  -- Drivers can see requests to accept them
);