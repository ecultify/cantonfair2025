/*
  # Quick Captures Table

  1. New Tables
    - `quick_captures`
      - `id` (uuid, primary key) - Unique identifier for each quick capture
      - `media_type` (text) - Type of media: 'photo' or 'video'
      - `media_url` (text) - URL to the product media file
      - `media_thumb_url` (text) - URL to thumbnail of the media
      - `product_name` (text, required) - Name of the product being captured
      - `remarks` (text) - Additional notes or remarks about the product
      - `visiting_card_url` (text) - URL to the visiting card image
      - `card_ocr_json` (jsonb) - Parsed OCR data from the visiting card
      - `poc_name` (text) - Point of contact name
      - `poc_company` (text) - Point of contact company name
      - `poc_city` (text) - City of the point of contact
      - `user_id` (uuid, foreign key to auth.users) - Owner of the capture
      - `vendor_id` (uuid, foreign key to vendors) - Associated vendor (optional)
      - `created_at` (timestamptz) - Timestamp when capture was created
      - `updated_at` (timestamptz) - Timestamp when capture was last updated

  2. Security
    - Enable RLS on `quick_captures` table
    - Add policy for authenticated users to view their own quick captures
    - Add policy for authenticated users to insert their own quick captures
    - Add policy for authenticated users to update their own quick captures
    - Add policy for authenticated users to delete their own quick captures

  3. Performance
    - Create index on `user_id` for fast user-specific queries
    - Create index on `created_at` (descending) for chronological ordering

  4. Important Notes
    - This table provides a unified capture form that combines product media, remarks, and visiting card information
    - The `vendor_id` is optional and can be linked later when processing captures
    - ON DELETE CASCADE ensures captures are deleted when user is deleted
    - ON DELETE SET NULL keeps captures when vendor is deleted (unlinks them)
*/

-- Quick Captures Table - Unified capture form
CREATE TABLE IF NOT EXISTS quick_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product Media (photo or video)
  media_type text CHECK (media_type IN ('photo', 'video')),
  media_url text,
  media_thumb_url text,
  
  -- Remarks & Product Name
  product_name text NOT NULL,
  remarks text,
  
  -- Visiting Card
  visiting_card_url text,
  card_ocr_json jsonb,
  
  -- POC Details
  poc_name text,
  poc_company text,
  poc_city text,
  
  -- Metadata
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quick_captures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own quick captures"
  ON quick_captures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick captures"
  ON quick_captures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick captures"
  ON quick_captures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick captures"
  ON quick_captures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_quick_captures_user_id ON quick_captures(user_id);
CREATE INDEX idx_quick_captures_created_at ON quick_captures(created_at DESC);