CREATE POLICY "Admins can update ride disputes"
ON public.ride_disputes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_driver_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
    RAISE EXCEPTION 'Only administrators can change driver verification status';
  END IF;

  IF NEW.is_active AND (OLD.verification_status IS DISTINCT FROM 'approved' OR OLD.is_suspended) THEN
    RAISE EXCEPTION 'Driver must be approved and not suspended to go online';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_driver_verification_fields ON public.driver_profiles;
CREATE TRIGGER guard_driver_verification_fields
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_driver_verification_fields();