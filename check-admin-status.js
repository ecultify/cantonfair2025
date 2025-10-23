const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read credentials from a.txt
const credentials = fs.readFileSync('a.txt', 'utf8');
const lines = credentials.split('\n');
const url = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='))?.split('=')[1]?.trim();
const serviceKey = lines.find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='))?.split('=')[1]?.trim();

if (!url || !serviceKey) {
  console.error('❌ Missing Supabase credentials in a.txt');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function checkAdminStatus() {
  console.log('🔍 Checking admin status for ecultify@gmail.com...\n');
  
  try {
    // Check if admin_roles table exists
    console.log('📋 Step 1: Checking if admin_roles table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('admin_roles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
        console.log('❌ admin_roles table does NOT exist');
        console.log('\n📝 You need to create the table first. Run this SQL in Supabase:');
        console.log('\n' + '='.repeat(80));
        printCreateTableSQL();
        return;
      }
      throw tableError;
    }
    
    console.log('✅ admin_roles table exists\n');
    
    // Get ecultify user ID
    console.log('📋 Step 2: Getting user ID for ecultify@gmail.com...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    
    const ecultifyUser = users.find(u => u.email === 'ecultify@gmail.com');
    
    if (!ecultifyUser) {
      console.log('❌ ecultify@gmail.com user NOT found in auth.users');
      console.log('   Make sure this account has been created');
      return;
    }
    
    console.log(`✅ Found user: ${ecultifyUser.email} (ID: ${ecultifyUser.id})\n`);
    
    // Check if user is in admin_roles
    console.log('📋 Step 3: Checking if user is in admin_roles table...');
    const { data: adminRoles, error: adminError } = await supabase
      .from('admin_roles')
      .select('*');
    
    if (adminError) throw adminError;
    
    console.log(`   Found ${adminRoles.length} admin(s) in the table:`);
    adminRoles.forEach(admin => {
      console.log(`   - ${admin.email} (User ID: ${admin.user_id})`);
    });
    
    const isAdmin = adminRoles.some(a => a.user_id === ecultifyUser.id);
    
    if (!isAdmin) {
      console.log('\n❌ ecultify@gmail.com is NOT in the admin_roles table');
      console.log('\n📝 Run this SQL to add them as admin:');
      console.log('\n' + '='.repeat(80));
      console.log(`INSERT INTO admin_roles (user_id, email, role)`);
      console.log(`VALUES ('${ecultifyUser.id}', 'ecultify@gmail.com', 'admin');`);
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('\n✅ ecultify@gmail.com IS an admin!');
      console.log('\n🎉 Everything is set up correctly!');
      console.log('   Try logging out and logging back in to see the User Management option.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function printCreateTableSQL() {
  console.log(`
-- Drop existing table if any
DROP TABLE IF EXISTS admin_roles CASCADE;

-- Create admin_roles table
CREATE TABLE admin_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view admin roles" ON admin_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert admin roles" ON admin_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

CREATE POLICY "Admins can update admin roles" ON admin_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'admin'
    )
  );

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
`);
  console.log('='.repeat(80) + '\n');
}

checkAdminStatus();

