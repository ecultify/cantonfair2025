-- ============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- 1. Go to your Supabase project → SQL Editor
-- 2. Copy/paste this entire file
-- 3. Click RUN
-- ============================================================================

-- Ensure the quick_captures table exists
CREATE TABLE IF NOT EXISTS quick_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text CHECK (media_type IN ('photo', 'video')),
  media_url text,
  media_thumb_url text,
  product_name text NOT NULL,
  remarks text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add multiple media support column
ALTER TABLE quick_captures
ADD COLUMN IF NOT EXISTS media_items jsonb DEFAULT '[]'::jsonb;

-- Add visiting card columns
ALTER TABLE quick_captures
ADD COLUMN IF NOT EXISTS visiting_card_url text,
ADD COLUMN IF NOT EXISTS card_ocr_json jsonb;

-- Add POC columns
ALTER TABLE quick_captures
ADD COLUMN IF NOT EXISTS poc_name text,
ADD COLUMN IF NOT EXISTS poc_company text,
ADD COLUMN IF NOT EXISTS poc_city text,
ADD COLUMN IF NOT EXISTS poc_phone text,
ADD COLUMN IF NOT EXISTS poc_email text,
ADD COLUMN IF NOT EXISTS poc_link text;

-- Enable RLS
ALTER TABLE quick_captures ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own quick captures" ON quick_captures;
DROP POLICY IF EXISTS "Users can insert own quick captures" ON quick_captures;
DROP POLICY IF EXISTS "Users can update own quick captures" ON quick_captures;
DROP POLICY IF EXISTS "Users can delete own quick captures" ON quick_captures;
DROP POLICY IF EXISTS "All authenticated users can view all quick captures" ON quick_captures;

-- Create RLS policies
CREATE POLICY "Users can view own quick captures"
  ON quick_captures FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick captures"
  ON quick_captures FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick captures"
  ON quick_captures FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick captures"
  ON quick_captures FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quick_captures_user_id ON quick_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_captures_created_at ON quick_captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_captures_media_items ON quick_captures USING GIN (media_items);
CREATE INDEX IF NOT EXISTS idx_quick_captures_poc_company ON quick_captures(poc_company);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_quick_captures_updated_at ON quick_captures;

CREATE TRIGGER update_quick_captures_updated_at
    BEFORE UPDATE ON quick_captures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ✅ MIGRATION COMPLETE!
-- Run the verification query below to check:

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quick_captures'
ORDER BY ordinal_position;

