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