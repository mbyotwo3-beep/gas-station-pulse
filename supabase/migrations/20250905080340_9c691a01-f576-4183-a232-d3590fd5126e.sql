-- First, let's add missing triggers for the existing functions and update profiles for favorites
-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for station_reports to set user_id if null
CREATE TRIGGER set_station_reports_user_id
BEFORE INSERT ON public.station_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_auth_user_id();

-- Add trigger for station_reports updated_at
CREATE TRIGGER update_station_reports_updated_at
BEFORE UPDATE ON public.station_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for station_reports so we get live updates
ALTER TABLE public.station_reports REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.station_reports;