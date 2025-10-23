-- Final admin setup with proper RLS policies

-- Drop existing table and policies
DROP TABLE IF EXISTS admin_roles CASCADE;

-- Create admin_roles table
CREATE TABLE admin_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to check if THEY are admin (their own row only)
CREATE POLICY "Users can check their own admin status"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Admins can view all admin roles
CREATE POLICY "Admins can view all admin roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Policy 3: Admins can insert new admins
CREATE POLICY "Admins can insert admin roles"
  ON admin_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Policy 4: Admins can update admin roles
CREATE POLICY "Admins can update admin roles"
  ON admin_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Policy 5: Admins can delete admin roles
CREATE POLICY "Admins can delete admin roles"
  ON admin_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

-- Insert ecultify@gmail.com as admin
INSERT INTO admin_roles (user_id, email, role)
SELECT id, 'ecultify@gmail.com', 'admin'
FROM auth.users 
WHERE email = 'ecultify@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);

