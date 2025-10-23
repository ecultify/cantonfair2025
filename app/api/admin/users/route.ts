import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create regular client to check auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthenticatedUser(request: Request) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Extract the token
  const token = authHeader.replace('Bearer ', '');
  
  // Create a client with the user's token
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ecultify@gmail.com to access this
    if (user.email !== 'ecultify@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users using admin client
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (data?.users || [])
      .filter((u: any) => u.email !== 'ecultify@gmail.com') // Exclude admin from list
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        emailConfirmed: u.email_confirmed_at ? true : false,
        phoneConfirmed: u.phone_confirmed_at ? true : false,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
      }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ecultify@gmail.com to delete users
    if (user.email !== 'ecultify@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Delete user using admin client
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

