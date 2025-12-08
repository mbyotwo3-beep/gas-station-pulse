-- Drop the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more restrictive SELECT policy
-- Users can view their own profile, admins can view all, 
-- and participants in active rides can see each other's basic info
CREATE POLICY "Users can view profiles with restrictions"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id  -- Own profile
  OR has_role(auth.uid(), 'admin'::app_role)  -- Admins
  OR EXISTS (  -- Active ride participants can see each other
    SELECT 1 FROM rides
    WHERE rides.status IN ('accepted', 'in_progress')
    AND (
      (rides.driver_id = auth.uid() AND rides.passenger_id = profiles.id)
      OR (rides.passenger_id = auth.uid() AND rides.driver_id = profiles.id)
    )
  )
  OR EXISTS (  -- Payment request participants can see each other
    SELECT 1 FROM payment_requests
    WHERE payment_requests.status = 'pending'
    AND (
      (payment_requests.from_user_id = auth.uid() AND payment_requests.to_user_id = profiles.id)
      OR (payment_requests.to_user_id = auth.uid() AND payment_requests.from_user_id = profiles.id)
    )
  )
);