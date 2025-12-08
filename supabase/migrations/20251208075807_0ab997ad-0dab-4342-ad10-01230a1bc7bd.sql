-- Storage Security Improvements
-- Fix station-photos INSERT policy to enforce user folder structure (matching avatars pattern)

-- Drop existing station-photos INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload station photos" ON storage.objects;

-- Create improved INSERT policy with folder ownership check
CREATE POLICY "Users can upload station photos to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'station-photos'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Note: The avatars bucket already has proper folder-based ownership enforcement