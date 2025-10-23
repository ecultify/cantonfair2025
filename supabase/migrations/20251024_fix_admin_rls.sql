-- Fix RLS policies for admin_roles to allow users to check their own admin status

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can insert admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can update admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can delete admin roles" ON admin_roles;

-- Allow authenticated users to check if THEY are admin (view their own row only)
CREATE POLICY "Users can check their own admin status" ON admin_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only admins can view ALL admin roles
CREATE POLICY "Admins can view all admin roles" ON admin_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Only admins can insert admin roles
CREATE POLICY "Admins can insert admin roles" ON admin_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Only admins can update admin roles
CREATE POLICY "Admins can update admin roles" ON admin_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Only admins can delete admin roles
CREATE POLICY "Admins can delete admin roles" ON admin_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

