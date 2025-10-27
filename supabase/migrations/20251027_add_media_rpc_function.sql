-- Create RPC function to efficiently fetch valid media captures
-- This filters out blob URLs at the database level for better performance

CREATE OR REPLACE FUNCTION get_valid_media_captures(limit_count integer DEFAULT 500)
RETURNS TABLE (
  id uuid,
  product_name text,
  remarks text,
  poc_name text,
  poc_company text,
  user_id uuid,
  created_at timestamptz,
  media_items jsonb,
  media_type text,
  media_url text,
  media_thumb_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qc.id,
    qc.product_name,
    qc.remarks,
    qc.poc_name,
    qc.poc_company,
    qc.user_id,
    qc.created_at,
    qc.media_items,
    qc.media_type,
    qc.media_url,
    qc.media_thumb_url
  FROM quick_captures qc
  WHERE 
    -- Exclude captures that ONLY have blob URLs
    (
      -- Has valid media_items (not blob URLs)
      (
        qc.media_items IS NOT NULL 
        AND qc.media_items::text NOT LIKE '%blob:%'
      )
      OR
      -- Has valid legacy media_url (not blob URL)
      (
        qc.media_url IS NOT NULL 
        AND qc.media_url NOT LIKE 'blob:%'
      )
      OR
      -- Or has no media at all (for captures with just product info)
      (
        (qc.media_items IS NULL OR qc.media_items::text = '[]')
        AND qc.media_url IS NULL
      )
    )
  ORDER BY qc.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_valid_media_captures(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_valid_media_captures(integer) TO anon;

-- Add comment
COMMENT ON FUNCTION get_valid_media_captures IS 'Efficiently fetches quick captures excluding blob URLs for admin media panel';

