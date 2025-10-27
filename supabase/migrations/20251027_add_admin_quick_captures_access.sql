-- Add RLS policy for admins to view all quick captures
-- This allows the ecultify admin user to see all uploaded videos and photos

-- Policy: Admins can view all quick captures
CREATE POLICY "Admins can view all quick captures"
  ON quick_captures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Policy: Admins can update all quick captures
CREATE POLICY "Admins can update all quick captures"
  ON quick_captures
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Policy: Admins can delete all quick captures
CREATE POLICY "Admins can delete all quick captures"
  ON quick_captures
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

