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

async function runMigration() {
  console.log('🚀 Running admin roles migration...');
  
  try {
    // Create admin_roles table
    console.log('📋 Creating admin_roles table...');
    const { error: createTableError } = await supabase
      .from('admin_roles')
      .select('id')
      .limit(1);
    
    if (createTableError && createTableError.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('🔨 Creating admin_roles table...');
      // We'll need to use raw SQL for table creation
      console.log('⚠️  Table creation requires manual SQL execution in Supabase dashboard');
      console.log('📝 Please run the following SQL in your Supabase SQL editor:');
      console.log('');
      console.log('-- Create admin_roles table');
      console.log('CREATE TABLE IF NOT EXISTS admin_roles (');
      console.log('  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,');
      console.log('  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,');
      console.log('  email text NOT NULL,');
      console.log('  role text NOT NULL DEFAULT \'admin\',');
      console.log('  created_at timestamp with time zone DEFAULT timezone(\'utc\'::text, now()) NOT NULL,');
      console.log('  updated_at timestamp with time zone DEFAULT timezone(\'utc\'::text, now()) NOT NULL');
      console.log(');');
      console.log('');
      console.log('-- Insert ecultify@gmail.com as admin');
      console.log('INSERT INTO admin_roles (user_id, email, role)');
      console.log('SELECT id, \'ecultify@gmail.com\', \'admin\'');
      console.log('FROM auth.users');
      console.log('WHERE email = \'ecultify@gmail.com\'');
      console.log('ON CONFLICT (user_id) DO NOTHING;');
      console.log('');
      console.log('-- Create indexes');
      console.log('CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);');
      console.log('');
      console.log('-- Enable RLS');
      console.log('ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Create RLS policies');
      console.log('CREATE POLICY "Admins can view admin roles" ON admin_roles');
      console.log('  FOR SELECT TO authenticated');
      console.log('  USING (');
      console.log('    EXISTS (');
      console.log('      SELECT 1 FROM admin_roles ar');
      console.log('      WHERE ar.user_id = auth.uid()');
      console.log('      AND ar.role = \'admin\'');
      console.log('    )');
      console.log('  );');
      console.log('');
      console.log('CREATE POLICY "Admins can insert admin roles" ON admin_roles');
      console.log('  FOR INSERT TO authenticated');
      console.log('  WITH CHECK (');
      console.log('    EXISTS (');
      console.log('      SELECT 1 FROM admin_roles ar');
      console.log('      WHERE ar.user_id = auth.uid()');
      console.log('      AND ar.role = \'admin\'');
      console.log('    )');
      console.log('  );');
      console.log('');
      console.log('CREATE POLICY "Admins can update admin roles" ON admin_roles');
      console.log('  FOR UPDATE TO authenticated');
      console.log('  USING (');
      console.log('    EXISTS (');
      console.log('      SELECT 1 FROM admin_roles ar');
      console.log('      WHERE ar.user_id = auth.uid()');
      console.log('      AND ar.role = \'admin\'');
      console.log('    )');
      console.log('  );');
      console.log('');
      console.log('CREATE POLICY "Admins can delete admin roles" ON admin_roles');
      console.log('  FOR DELETE TO authenticated');
      console.log('  USING (');
      console.log('    EXISTS (');
      console.log('      SELECT 1 FROM admin_roles ar');
      console.log('      WHERE ar.user_id = auth.uid()');
      console.log('      AND ar.role = \'admin\'');
      console.log('    )');
      console.log('  );');
      console.log('');
      console.log('✅ After running the SQL above, the admin functionality will be ready!');
    } else {
      console.log('✅ Admin roles table already exists');
    }
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
