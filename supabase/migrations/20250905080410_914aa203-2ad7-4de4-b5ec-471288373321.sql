-- Enable realtime for station_reports so we get live updates
ALTER TABLE public.station_reports REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.station_reports;

-- Also enable realtime for profiles for favorites sync
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.profiles;