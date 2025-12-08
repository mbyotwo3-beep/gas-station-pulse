-- Fix PUBLIC_DATA_EXPOSURE: Restrict driver_profiles SELECT access
-- Drop the overly permissive policy that exposes all driver info
DROP POLICY IF EXISTS "Driver profiles are viewable by everyone" ON public.driver_profiles;

-- Create restricted policy: only owner, admins, and active ride passengers can view
CREATE POLICY "Driver profiles viewable by authorized users"
ON public.driver_profiles FOR SELECT
USING (
  auth.uid() = user_id  -- Driver can see own profile
  OR has_role(auth.uid(), 'admin'::app_role)  -- Admins can see all
  OR EXISTS (  -- Passengers in active rides with this driver
    SELECT 1 FROM rides
    WHERE rides.driver_id = driver_profiles.user_id
    AND rides.passenger_id = auth.uid()
    AND rides.status IN ('accepted', 'in_progress')
  )
);