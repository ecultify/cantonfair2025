-- SQL Query to check what URLs are stored in your database
-- Run this in Supabase SQL Editor to see the actual URLs

SELECT 
  id,
  product_name,
  media_items,
  media_type,
  media_url,
  created_at
FROM quick_captures
ORDER BY created_at DESC
LIMIT 5;

-- This will show you:
-- 1. If media_items contains blob URLs or Supabase Storage URLs
-- 2. If the URLs start with your Supabase Storage URL (should be like: https://[project-id].supabase.co/storage/v1/object/public/...)

-- Expected format for Supabase Storage URLs:
-- https://[project-id].supabase.co/storage/v1/object/public/media/[file-path]

-- If you see blob: URLs, it means the files weren't properly uploaded to Supabase Storage

