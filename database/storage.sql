-- YukFlix Storage Buckets Configuration
-- Run this in Supabase SQL Editor after creating the bucket in Storage UI

-- Create storage bucket (do this in Supabase Dashboard > Storage first):
-- 1. media (public)
--    This bucket will contain:
--    - posters/
--    - backdrops/
--    - behind-the-scenes/

-- Storage policies for 'media' bucket
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');
