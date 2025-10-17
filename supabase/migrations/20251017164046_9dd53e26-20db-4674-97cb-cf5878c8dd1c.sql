-- Create storage buckets for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('station-photos', 'station-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]);

-- Storage policies for station photos
CREATE POLICY "Station photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'station-photos');

CREATE POLICY "Authenticated users can upload station photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'station-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their uploaded station photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'station-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their uploaded station photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'station-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create ride ratings table
CREATE TABLE public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL,
  rated_user UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ride_id, rated_by)
);

-- Enable RLS on ride_ratings
ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;

-- Ride ratings policies
CREATE POLICY "Users can view ratings for their rides"
ON public.ride_ratings FOR SELECT
USING (
  rated_by = auth.uid() OR rated_user = auth.uid()
);

CREATE POLICY "Users can create ratings for completed rides"
ON public.ride_ratings FOR INSERT
WITH CHECK (
  auth.uid() = rated_by
  AND EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = ride_id 
    AND status = 'completed'
    AND (driver_id = auth.uid() OR passenger_id = auth.uid())
  )
);

-- Add indexes
CREATE INDEX idx_ride_ratings_ride_id ON public.ride_ratings(ride_id);
CREATE INDEX idx_ride_ratings_rated_user ON public.ride_ratings(rated_user);

-- Enable realtime for ride_ratings
ALTER TABLE public.ride_ratings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_ratings;