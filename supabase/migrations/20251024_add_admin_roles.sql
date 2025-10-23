-- Add admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for admin roles
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin roles
CREATE POLICY "Admins can view admin roles" ON admin_roles
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

-- Insert ecultify@gmail.com as admin
INSERT INTO admin_roles (user_id, email, role)
SELECT id, 'ecultify@gmail.com', 'admin'
FROM auth.users 
WHERE email = 'ecultify@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
