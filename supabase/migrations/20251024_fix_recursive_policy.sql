-- Fix infinite recursion in admin_roles RLS policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can check their own admin status" ON admin_roles;
DROP POLICY IF EXISTS "Admins can view all admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can insert admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can update admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can delete admin roles" ON admin_roles;

-- Simple policy: Allow all authenticated users to read their own row
-- This prevents infinite recursion because it only checks auth.uid(), not the table itself
CREATE POLICY "Allow users to read their own admin status"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- For admin operations (insert/update/delete), we'll handle permissions in the API routes
-- So we don't need policies for those - they'll be blocked by default

