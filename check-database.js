/**
 * Database Analysis Script
 * Connects to Supabase and analyzes quick_captures records
 */

const { createClient } = require('@supabase/supabase-js');

// Read credentials
const SUPABASE_URL = 'https://omtewsyzhlhhkmpyaqow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGV3c3l6aGxoaGttcHlhcW93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE3OTQzMywiZXhwIjoyMDc2NzU1NDMzfQ.GpGP3SEWiw8bJy2tM6cBnewUQQ5ViaZYEUAlXzSJxTQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeDatabase() {
  console.log('🔍 Connecting to Supabase...\n');
  
  try {
    // Fetch all quick_captures
    const { data: captures, error } = await supabase
      .from('quick_captures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }
    
    console.log(`✅ Found ${captures.length} recent captures\n`);
    console.log('═'.repeat(80));
    
    captures.forEach((capture, index) => {
      console.log(`\n📦 CAPTURE #${index + 1}`);
      console.log('─'.repeat(80));
      console.log(`ID: ${capture.id}`);
      console.log(`Product Name: ${capture.product_name}`);
      console.log(`Created: ${new Date(capture.created_at).toLocaleString()}`);
      
      // Check media_items
      console.log('\n📸 MEDIA_ITEMS:');
      if (!capture.media_items) {
        console.log('   ⚠️  NULL - No media_items column data');
      } else if (Array.isArray(capture.media_items) && capture.media_items.length === 0) {
        console.log('   ⚠️  EMPTY ARRAY [] - No media captured');
      } else if (Array.isArray(capture.media_items)) {
        console.log(`   ✅ ${capture.media_items.length} media item(s) found`);
        capture.media_items.forEach((item, i) => {
          console.log(`\n   Media #${i + 1}:`);
          console.log(`   - Type: ${item.type}`);
          console.log(`   - URL length: ${item.url ? item.url.length : 0} characters`);
          console.log(`   - URL preview: ${item.url ? item.url.substring(0, 50) + '...' : 'MISSING'}`);
          console.log(`   - Thumb URL: ${item.thumbUrl ? 'Present' : 'None'}`);
          
          // Check if it's a valid data URL
          if (item.url) {
            if (item.url.startsWith('data:video/')) {
              console.log(`   ✅ Valid video data URL`);
            } else if (item.url.startsWith('data:image/')) {
              console.log(`   ✅ Valid image data URL`);
            } else if (item.url.startsWith('blob:')) {
              console.log(`   ❌ PROBLEM: Blob URL (temporary, won't work)`);
            } else if (item.url.startsWith('http')) {
              console.log(`   ✅ External URL`);
            } else {
              console.log(`   ❌ PROBLEM: Unknown URL format`);
            }
          } else {
            console.log(`   ❌ PROBLEM: URL is missing or null`);
          }
        });
      } else {
        console.log(`   ⚠️  UNEXPECTED FORMAT: ${typeof capture.media_items}`);
        console.log(`   Value: ${JSON.stringify(capture.media_items).substring(0, 200)}`);
      }
      
      // Check visiting card
      console.log('\n💳 VISITING CARD:');
      if (capture.visiting_card_url) {
        console.log(`   ✅ Present (${capture.visiting_card_url.length} chars)`);
      } else {
        console.log('   - Not captured');
      }
      
      // Check POC details
      console.log('\n👤 POC DETAILS:');
      const pocFields = ['poc_name', 'poc_company', 'poc_city', 'poc_phone', 'poc_email', 'poc_link'];
      let hasPoc = false;
      pocFields.forEach(field => {
        if (capture[field]) {
          console.log(`   ✅ ${field}: ${capture[field]}`);
          hasPoc = true;
        }
      });
      if (!hasPoc) {
        console.log('   - No POC details');
      }
      
      console.log('\n' + '═'.repeat(80));
    });
    
    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log('─'.repeat(80));
    
    const withMedia = captures.filter(c => c.media_items && c.media_items.length > 0).length;
    const withVideos = captures.filter(c => 
      c.media_items && c.media_items.some(m => m.type === 'video')
    ).length;
    const withPhotos = captures.filter(c => 
      c.media_items && c.media_items.some(m => m.type === 'photo')
    ).length;
    const withCard = captures.filter(c => c.visiting_card_url).length;
    
    console.log(`Total captures analyzed: ${captures.length}`);
    console.log(`Captures with media_items: ${withMedia}`);
    console.log(`Captures with videos: ${withVideos}`);
    console.log(`Captures with photos: ${withPhotos}`);
    console.log(`Captures with visiting card: ${withCard}`);
    
    // Check for common issues
    console.log('\n\n🔧 ISSUES DETECTED:');
    console.log('─'.repeat(80));
    
    let issuesFound = false;
    captures.forEach(capture => {
      if (capture.media_items && Array.isArray(capture.media_items)) {
        capture.media_items.forEach((item, i) => {
          if (item.url && item.url.startsWith('blob:')) {
            console.log(`❌ ${capture.product_name}: Media #${i + 1} has blob URL (temporary, won't persist)`);
            issuesFound = true;
          }
          if (!item.url) {
            console.log(`❌ ${capture.product_name}: Media #${i + 1} has missing URL`);
            issuesFound = true;
          }
        });
      }
    });
    
    if (!issuesFound) {
      console.log('✅ No issues detected!');
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

// Run the analysis
analyzeDatabase().then(() => {
  console.log('\n✅ Analysis complete!\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

