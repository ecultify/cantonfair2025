/*
  # Canton Fair Capture - Database Schema

  1. New Tables
    - `vendors` - Company/vendor information from Canton Fair
      - `id` (uuid, primary key)
      - `company_name` (text) - Company name
      - `brand_name` (text) - Brand name if different
      - `country` (text) - Country of origin
      - `website` (text) - Company website
      - `email` (text) - Company email
      - `phone` (text) - Contact phone
      - `wechat_id` (text) - WeChat ID
      - `whatsapp` (text) - WhatsApp number
      - `address` (text) - Full address
      - `phase` (text) - Canton Fair phase (1/2/3)
      - `hall` (text) - Hall number
      - `stall` (text) - Stall number
      - `aisle` (text) - Aisle location
      - `map_link` (text) - Google Maps link
      - `source` (text) - Always "CantonFair"
      - `tags` (jsonb) - Array of tags
      - `user_id` (uuid) - Owner user ID
      - `created_at`, `updated_at` (timestamptz)
    
    - `pocs` - Points of contact for vendors
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key)
      - `name` (text) - Contact name
      - `designation` (text) - Job title
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone
      - `wechat_id` (text) - WeChat ID
      - `whatsapp` (text) - WhatsApp number
      - `notes` (text) - Additional notes
      - `created_at`, `updated_at` (timestamptz)
    
    - `products` - Products from vendors
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key)
      - `name` (text) - Product name
      - `category` (text) - Main category
      - `subcategory` (text) - Subcategory
      - `description` (text) - Product description
      - `moq` (integer) - Minimum order quantity
      - `unit_price` (decimal) - Price per unit
      - `currency` (text) - Currency code (INR/CNY/USD)
      - `lead_time` (text) - Lead time description
      - `hs_code` (text) - Harmonized System code
      - `certifications` (text) - Certifications list
      - `samples_available` (boolean) - Samples availability
      - `warranty` (text) - Warranty information
      - `rating` (integer) - 1-5 star rating
      - `created_at`, `updated_at` (timestamptz)
    
    - `media` - Photos, videos, visiting cards
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key, nullable)
      - `product_id` (uuid, foreign key, nullable)
      - `type` (text) - image/video/card
      - `file_url` (text) - Cloud storage URL
      - `local_path` (text) - Local file path for offline
      - `thumb_url` (text) - Thumbnail URL
      - `ocr_json` (jsonb) - OCR results for cards
      - `notes` (text) - Additional notes
      - `user_id` (uuid) - Owner user ID
      - `created_at` (timestamptz)
    
    - `notes` - Text notes and remarks
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key, nullable)
      - `product_id` (uuid, foreign key, nullable)
      - `text` (text) - Note content
      - `sentiment` (text) - hot/neutral/cold
      - `next_steps` (text) - Action items
      - `bookmarked` (boolean) - Bookmark flag
      - `user_id` (uuid) - Owner user ID
      - `created_at`, `updated_at` (timestamptz)
    
    - `meetings` - Scheduled meetings
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key)
      - `meeting_at` (timestamptz) - Meeting date/time
      - `location` (text) - Meeting location
      - `attendees` (text) - Attendees list
      - `summary` (text) - Meeting summary
      - `user_id` (uuid) - Owner user ID
      - `created_at`, `updated_at` (timestamptz)
    
    - `follow_ups` - Follow-up tasks and reminders
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key)
      - `status` (text) - to-contact/quoted/sampling/ordered/on-hold/closed
      - `due_at` (timestamptz) - Due date
      - `remind` (boolean) - Reminder enabled
      - `assignee` (text) - Assigned person
      - `notes` (text) - Follow-up notes
      - `user_id` (uuid) - Owner user ID
      - `created_at`, `updated_at` (timestamptz)
    
    - `tags` - Reusable tags
      - `id` (uuid, primary key)
      - `label` (text, unique) - Tag label
      - `color` (text) - Display color
      - `user_id` (uuid) - Owner user ID
      - `created_at` (timestamptz)
    
    - `links` - External links for vendors
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key)
      - `type` (text) - catalog/pdf/site/map
      - `url` (text) - Link URL
      - `title` (text) - Link title
      - `created_at` (timestamptz)
    
    - `sync_queue` - Offline sync queue
      - `id` (uuid, primary key)
      - `entity_type` (text) - Table name
      - `entity_id` (text) - Record ID
      - `operation` (text) - create/update/delete
      - `payload` (jsonb) - Data to sync
      - `user_id` (uuid) - Owner user ID
      - `synced` (boolean) - Sync status
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  brand_name text,
  country text,
  website text,
  email text,
  phone text,
  wechat_id text,
  whatsapp text,
  address text,
  phase text,
  hall text,
  stall text,
  aisle text,
  map_link text,
  source text DEFAULT 'CantonFair',
  tags jsonb DEFAULT '[]'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors"
  ON vendors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create POCs table
CREATE TABLE IF NOT EXISTS pocs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  designation text,
  email text,
  phone text,
  wechat_id text,
  whatsapp text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pocs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pocs for own vendors"
  ON pocs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = pocs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pocs for own vendors"
  ON pocs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = pocs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pocs for own vendors"
  ON pocs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = pocs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = pocs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pocs for own vendors"
  ON pocs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = pocs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  subcategory text,
  description text,
  moq integer,
  unit_price decimal,
  currency text DEFAULT 'CNY',
  lead_time text,
  hs_code text,
  certifications text,
  samples_available boolean DEFAULT false,
  warranty text,
  rating integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products for own vendors"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products for own vendors"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products for own vendors"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products for own vendors"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL,
  file_url text,
  local_path text,
  thumb_url text,
  ocr_json jsonb,
  notes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media"
  ON media FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON media FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON media FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  text text NOT NULL,
  sentiment text DEFAULT 'neutral',
  next_steps text,
  bookmarked boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  meeting_at timestamptz NOT NULL,
  location text,
  attendees text,
  summary text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'to-contact',
  due_at timestamptz,
  remind boolean DEFAULT true,
  assignee text,
  notes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follow_ups"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follow_ups"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow_ups"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follow_ups"
  ON follow_ups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text UNIQUE NOT NULL,
  color text DEFAULT '#3b82f6',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  title text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links for own vendors"
  ON links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = links.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert links for own vendors"
  ON links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = links.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update links for own vendors"
  ON links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = links.vendor_id
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = links.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links for own vendors"
  ON links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = links.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Create sync_queue table
CREATE TABLE IF NOT EXISTS sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  operation text NOT NULL,
  payload jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  synced boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync_queue"
  ON sync_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync_queue"
  ON sync_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync_queue"
  ON sync_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync_queue"
  ON sync_queue FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_company_name ON vendors(company_name);
CREATE INDEX IF NOT EXISTS idx_vendors_phase_hall ON vendors(phase, hall);
CREATE INDEX IF NOT EXISTS idx_pocs_vendor_id ON pocs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_media_vendor_id ON media(vendor_id);
CREATE INDEX IF NOT EXISTS idx_media_product_id ON media(product_id);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_vendor_id ON notes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_vendor_id ON follow_ups(vendor_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_at ON follow_ups(due_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);