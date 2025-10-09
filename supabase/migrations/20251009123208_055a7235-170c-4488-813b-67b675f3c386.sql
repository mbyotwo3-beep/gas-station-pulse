-- Add photos and fuel prices to stations table
ALTER TABLE public.stations
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fuel_prices jsonb DEFAULT '{}'::jsonb;

-- Create station_reviews table
CREATE TABLE IF NOT EXISTS public.station_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id text NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on station_reviews
ALTER TABLE public.station_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for station_reviews
CREATE POLICY "Reviews are viewable by everyone"
ON public.station_reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.station_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.station_reviews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.station_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_station_reviews_updated_at
BEFORE UPDATE ON public.station_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_station_reviews_station_id ON public.station_reviews(station_id);
CREATE INDEX IF NOT EXISTS idx_station_reviews_user_id ON public.station_reviews(user_id);