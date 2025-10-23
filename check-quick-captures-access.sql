-- ========================================
-- SQL QUERIES TO VERIFY QUICK_CAPTURES PUBLIC ACCESS
-- Run these in Supabase SQL Editor
-- ========================================

-- 1. CHECK RLS POLICIES ON QUICK_CAPTURES TABLE
-- This shows all policies and their conditions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'quick_captures'
ORDER BY policyname;

-- Expected Result:
-- You should see "All authenticated users can view all quick captures" 
-- with cmd='SELECT' and qual='true'


-- ========================================
-- 2. COUNT TOTAL CAPTURES vs CAPTURES BY USER
-- This verifies if all captures are visible to everyone
SELECT 
  (SELECT COUNT(*) FROM quick_captures) as total_captures,
  (SELECT COUNT(DISTINCT user_id) FROM quick_captures) as total_users_with_captures,
  (SELECT COUNT(*) FROM quick_captures WHERE user_id = auth.uid()) as my_captures
;

-- Expected Result:
-- If total_captures > my_captures, you can see other users' captures!


-- ========================================
-- 3. VIEW ALL CAPTURES WITH USER INFO
-- Shows all captures and who created them
SELECT 
  qc.id,
  qc.product_name,
  qc.poc_name,
  qc.poc_company,
  qc.user_id,
  au.email as created_by_email,
  qc.created_at
FROM quick_captures qc
LEFT JOIN auth.users au ON qc.user_id = au.id
ORDER BY qc.created_at DESC
LIMIT 20;

-- Expected Result:
-- You should see captures from MULTIPLE different user_ids/emails
-- If you only see your own email, public access is NOT working


-- ========================================
-- 4. CHECK IF RLS IS ENABLED
-- Verify Row Level Security is turned on
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'quick_captures';

-- Expected Result:
-- rowsecurity should be 'true'


-- ========================================
-- 5. TEST POLICY PERMISSIONS
-- Check what operations you can perform
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Can View'
    WHEN cmd = 'INSERT' THEN 'Can Create'
    WHEN cmd = 'UPDATE' THEN 'Can Edit'
    WHEN cmd = 'DELETE' THEN 'Can Delete'
  END as permission_type,
  qual as condition
FROM pg_policies 
WHERE tablename = 'quick_captures'
ORDER BY cmd;

-- Expected Result for Public Viewing:
-- SELECT operation should have condition: 'true' (no restrictions)
-- INSERT/UPDATE/DELETE should have condition: '(auth.uid() = user_id)' (own records only)


-- ========================================
-- 6. VERIFY PUBLIC ACCESS MIGRATION WAS APPLIED
-- Check if the specific policy exists
SELECT EXISTS (
  SELECT 1 
  FROM pg_policies 
  WHERE tablename = 'quick_captures' 
  AND policyname = 'All authenticated users can view all quick captures'
) as public_access_policy_exists;

-- Expected Result:
-- Should return 'true'


-- ========================================
-- 7. QUICK DIAGNOSIS
-- Single query to check everything
SELECT 
  'RLS Enabled' as check_type,
  CASE WHEN rowsecurity THEN '✅ YES' ELSE '❌ NO' END as status
FROM pg_tables 
WHERE tablename = 'quick_captures'

UNION ALL

SELECT 
  'Public View Policy Exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quick_captures' 
    AND policyname LIKE '%All authenticated users%'
  ) THEN '✅ YES' ELSE '❌ NO' END

UNION ALL

SELECT 
  'View Policy is Public',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quick_captures' 
    AND cmd = 'SELECT'
    AND qual = 'true'
  ) THEN '✅ YES (All can view)' ELSE '❌ NO (Restricted)' END

UNION ALL

SELECT 
  'Total Captures in DB',
  COALESCE((SELECT COUNT(*)::text FROM quick_captures), '0')

UNION ALL

SELECT 
  'Different Users with Captures',
  COALESCE((SELECT COUNT(DISTINCT user_id)::text FROM quick_captures), '0');

-- Expected Result:
-- All checks should show ✅ YES for proper public access

