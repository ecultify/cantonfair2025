
ALTER TABLE quick_captures
ADD COLUMN IF NOT EXISTS poc_phone text,
ADD COLUMN IF NOT EXISTS poc_email text;

COMMENT ON COLUMN quick_captures.poc_phone IS 'Phone number from visiting card or manual entry';
COMMENT ON COLUMN quick_captures.poc_email IS 'Email address from visiting card or manual entry';


DROP POLICY IF EXISTS "Users can view own quick captures" ON quick_captures;


CREATE POLICY "All authenticated users can view all quick captures"
  ON quick_captures FOR SELECT
  TO authenticated
  USING (true);


CREATE INDEX IF NOT EXISTS idx_quick_captures_poc_email ON quick_captures(poc_email);
CREATE INDEX IF NOT EXISTS idx_quick_captures_poc_phone ON quick_captures(poc_phone);

