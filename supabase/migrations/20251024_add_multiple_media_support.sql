-- Add support for multiple photos and videos in quick_captures
-- This replaces the single media_url with arrays of media items

-- Add new columns for multiple media
ALTER TABLE quick_captures
ADD COLUMN IF NOT EXISTS media_items jsonb DEFAULT '[]'::jsonb;

-- media_items structure: [
--   {type: 'photo', url: 'https://...', thumbUrl: 'https://...'},
--   {type: 'video', url: 'https://...', thumbUrl: 'https://...'}
-- ]

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quick_captures_media_items ON quick_captures USING GIN (media_items);

-- Add comment for documentation
COMMENT ON COLUMN quick_captures.media_items IS 'Array of media items (photos and videos) captured for this product. Each item has type, url, and optional thumbUrl';

-- Note: We're keeping the old media_type, media_url, and media_thumb_url columns
-- for backward compatibility. The application will migrate data to media_items.

