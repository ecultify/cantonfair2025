-- Add link column to quick_captures table
ALTER TABLE quick_captures
ADD COLUMN IF NOT EXISTS poc_link text;

-- Add comment to the column
COMMENT ON COLUMN quick_captures.poc_link IS 'Website or social media link for the POC/Company';

