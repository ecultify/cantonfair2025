/**
 * Diagnostic script to check quick_captures data in Supabase
 * 
 * Usage: node check-quick-captures.js
 * 
 * This will show you:
 * - How many quick captures exist
 * - Their product names
 * - Their media format (media_items array vs legacy media_url)
 */

// Load environment variables from .env.local manually
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuickCaptures() {
  console.log('🔍 Checking quick_captures table...\n');

  try {
    // Fetch all quick captures
    const { data: captures, error } = await supabase
      .from('quick_captures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching captures:', error.message);
      return;
    }

    if (!captures || captures.length === 0) {
      console.log('⚠️  No quick captures found in database');
      console.log('   Try creating a capture from the app first!');
      return;
    }

    console.log(`✅ Found ${captures.length} quick capture(s)\n`);

    captures.forEach((capture, index) => {
      console.log(`--- Capture #${index + 1} ---`);
      console.log(`ID: ${capture.id}`);
      console.log(`Product Name: ${capture.product_name || '(none)'}`);
      console.log(`Created: ${new Date(capture.created_at).toLocaleString()}`);
      console.log(`User ID: ${capture.user_id}`);
      
      // Check media format
      if (capture.media_items && Array.isArray(capture.media_items) && capture.media_items.length > 0) {
        console.log(`✅ Has media_items array: ${capture.media_items.length} item(s)`);
        capture.media_items.forEach((item, i) => {
          console.log(`   - Item ${i + 1}: ${item.type} - ${item.url?.substring(0, 50)}...`);
        });
      } else if (capture.media_url && capture.media_type) {
        console.log(`📷 Has legacy media: ${capture.media_type} - ${capture.media_url?.substring(0, 50)}...`);
      } else {
        console.log(`⚠️  No media found (neither media_items nor media_url)`);
      }

      // POC info
      if (capture.poc_name || capture.poc_company) {
        console.log(`POC: ${capture.poc_name || ''} ${capture.poc_company ? `(${capture.poc_company})` : ''}`);
      }
      
      console.log('');
    });

    // Summary
    const withMediaItems = captures.filter(c => c.media_items && Array.isArray(c.media_items) && c.media_items.length > 0).length;
    const withLegacyMedia = captures.filter(c => c.media_url && c.media_type).length;
    const withNoMedia = captures.filter(c => 
      (!c.media_items || !Array.isArray(c.media_items) || c.media_items.length === 0) && 
      (!c.media_url || !c.media_type)
    ).length;

    console.log('📊 Summary:');
    console.log(`   Total captures: ${captures.length}`);
    console.log(`   With media_items array: ${withMediaItems}`);
    console.log(`   With legacy media_url: ${withLegacyMedia}`);
    console.log(`   With no media: ${withNoMedia}`);

    // Count videos and photos
    let videoCount = 0;
    let photoCount = 0;
    
    captures.forEach(capture => {
      if (capture.media_items && Array.isArray(capture.media_items)) {
        capture.media_items.forEach(item => {
          if (item.type === 'video') videoCount++;
          if (item.type === 'photo') photoCount++;
        });
      }
      if (capture.media_type === 'video') videoCount++;
      if (capture.media_type === 'photo') photoCount++;
    });

    console.log(`\n🎬 Media Count:`);
    console.log(`   Videos: ${videoCount}`);
    console.log(`   Photos: ${photoCount}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkQuickCaptures();

