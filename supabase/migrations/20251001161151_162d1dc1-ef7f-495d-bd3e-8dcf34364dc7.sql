-- Create stations table for permanent storage
CREATE TABLE IF NOT EXISTS public.stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  brand TEXT,
  fuel_types TEXT[],
  amenities TEXT[],
  operating_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- Everyone can view stations
CREATE POLICY "Stations are viewable by everyone"
ON public.stations
FOR SELECT
USING (true);

-- Only managers and admins can create stations
CREATE POLICY "Managers can create stations"
ON public.stations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only managers and admins can update stations
CREATE POLICY "Managers can update stations"
ON public.stations
FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can delete stations
CREATE POLICY "Admins can delete stations"
ON public.stations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_stations_updated_at
BEFORE UPDATE ON public.stations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key to station_reports to link to stations table
ALTER TABLE public.station_reports
ADD CONSTRAINT fk_station_reports_station_id
FOREIGN KEY (station_id) REFERENCES public.stations(id)
ON DELETE CASCADE;

-- Insert demo stations around Lusaka
INSERT INTO public.stations (id, name, address, lat, lng, brand, fuel_types) VALUES
('lusaka-central', 'Shell Lusaka Central', 'Cairo Road, Lusaka', -15.4067, 28.2871, 'Shell', ARRAY['petrol', 'diesel']),
('lusaka-kabulonga', 'Total Kabulonga', 'Kabulonga Shopping Mall', -15.3928, 28.3152, 'Total', ARRAY['petrol', 'diesel', 'premium']),
('lusaka-woodlands', 'BP Woodlands', 'Great East Road, Woodlands', -15.3654, 28.3891, 'BP', ARRAY['petrol', 'diesel']),
('lusaka-roma', 'Puma Roma', 'Roma Township, Lusaka', -15.3598, 28.2654, 'Puma', ARRAY['petrol', 'diesel']),
('lusaka-chelston', 'Shell Chelston', 'Chelston Shopping Centre', -15.4234, 28.3456, 'Shell', ARRAY['petrol', 'diesel', 'premium']),
('lusaka-chilanga', 'Total Chilanga', 'Chilanga Road', -15.5123, 28.2987, 'Total', ARRAY['petrol', 'diesel'])
ON CONFLICT (id) DO NOTHING;