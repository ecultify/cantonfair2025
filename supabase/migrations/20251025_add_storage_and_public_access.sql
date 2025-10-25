-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'canton-fair-media',
  'canton-fair-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to storage bucket (anyone can read)
CREATE POLICY "Public Access for Media"
ON storage.objects FOR SELECT
USING (bucket_id = 'canton-fair-media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'canton-fair-media'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'canton-fair-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix quick_captures RLS to allow all authenticated users to see all captures
DROP POLICY IF EXISTS "Users can view own quick_captures" ON quick_captures;
DROP POLICY IF EXISTS "Users can insert own quick_captures" ON quick_captures;
DROP POLICY IF EXISTS "Users can update own quick_captures" ON quick_captures;
DROP POLICY IF EXISTS "Users can delete own quick_captures" ON quick_captures;

-- New policy: All authenticated users can view ALL quick captures (public access)
CREATE POLICY "All authenticated users can view all quick_captures"
ON quick_captures FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own captures
CREATE POLICY "Users can insert own quick_captures"
ON quick_captures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own captures
CREATE POLICY "Users can update own quick_captures"
ON quick_captures FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own captures
CREATE POLICY "Users can delete own quick_captures"
ON quick_captures FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

