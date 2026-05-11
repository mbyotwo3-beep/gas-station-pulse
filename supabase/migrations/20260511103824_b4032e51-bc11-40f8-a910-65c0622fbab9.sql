
-- 1. transactions: explicitly block direct INSERTs (only SECURITY DEFINER functions should write)
CREATE POLICY "Block direct transaction inserts"
ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (false);

-- 2. user_roles: explicit restrictive policy preventing self-role-assignment
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. station_reports: restrict reads to reporter, managers, admins
DROP POLICY IF EXISTS "Station reports viewable by authenticated" ON public.station_reports;
CREATE POLICY "Station reports viewable by reporter and staff"
ON public.station_reports
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 5. wallets: block direct UPDATEs (only SECURITY DEFINER wallet functions modify balances)
CREATE POLICY "Block direct wallet updates"
ON public.wallets
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. ride_requests: add DELETE policy
CREATE POLICY "Passengers and admins can delete ride requests"
ON public.ride_requests
FOR DELETE TO authenticated
USING (auth.uid() = passenger_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Storage: prevent listing of public buckets by anon (require auth to list, files still readable via direct URL)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars readable by authenticated users"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

-- station-photos: restrict listing to authenticated; objects still public-served via Supabase CDN
DROP POLICY IF EXISTS "Station photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view station photos" ON storage.objects;
CREATE POLICY "Station photos readable by authenticated users"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'station-photos');

-- 8. Revoke EXECUTE from anon on SECURITY DEFINER functions that should require auth
REVOKE EXECUTE ON FUNCTION public.add_wallet_funds(uuid, numeric, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_wallet_funds(uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_wallet_funds(uuid, uuid, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_additional_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_nearest_runner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_safe_driver_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_safe_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
