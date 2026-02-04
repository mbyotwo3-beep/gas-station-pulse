-- Create a security definer function to return safe profile data (without email)
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  primary_role app_role,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.primary_role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy for users to view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add comment explaining the security pattern
COMMENT ON FUNCTION public.get_safe_profile IS 'Returns profile data without sensitive fields (email) for use when viewing other users profiles';