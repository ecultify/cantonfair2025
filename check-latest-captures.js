const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://omtewsyzhlhhkmpyaqow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGV3c3l6aGxoaGttcHlhcW93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE3OTQzMywiZXhwIjoyMDc2NzU1NDMzfQ.GpGP3SEWiw8bJy2tM6cBnewUQQ5ViaZYEUAlXzSJxTQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLatest() {
  console.log('🔍 Checking latest 3 captures for OCR data...\n');
  
  const { data, error } = await supabase
    .from('quick_captures')
    .select('id, product_name, created_at, visiting_card_url, poc_name, poc_company, poc_email, poc_phone, media_items')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  data.forEach((capture, i) => {
    console.log(`\n━━━ CAPTURE #${i + 1} ━━━`);
    console.log(`Product: ${capture.product_name}`);
    console.log(`Created: ${new Date(capture.created_at).toLocaleString()}`);
    console.log(`\n📸 Visiting Card:`);
    if (capture.visiting_card_url) {
      console.log(`   ✅ Saved (${capture.visiting_card_url.length} chars)`);
      console.log(`   Type: ${capture.visiting_card_url.substring(0, 30)}...`);
    } else {
      console.log(`   ❌ Not captured`);
    }
    
    console.log(`\n🤖 OCR Extraction Results:`);
    if (capture.poc_name || capture.poc_company || capture.poc_email || capture.poc_phone) {
      console.log(`   ✅ OCR WORKED!`);
      if (capture.poc_name) console.log(`   - Name: ${capture.poc_name}`);
      if (capture.poc_company) console.log(`   - Company: ${capture.poc_company}`);
      if (capture.poc_email) console.log(`   - Email: ${capture.poc_email}`);
      if (capture.poc_phone) console.log(`   - Phone: ${capture.poc_phone}`);
    } else {
      console.log(`   ❌ OCR FAILED - No POC data extracted`);
    }
    
    console.log(`\n📹 Media Items:`);
    if (capture.media_items && Array.isArray(capture.media_items) && capture.media_items.length > 0) {
      capture.media_items.forEach((item, idx) => {
        console.log(`   Item ${idx + 1}: ${item.type}`);
        console.log(`      URL: ${item.url ? item.url.substring(0, 50) + '...' : 'MISSING'}`);
        if (item.url && item.url.startsWith('blob:')) {
          console.log(`      ❌ BLOB URL - WON'T WORK!`);
        } else if (item.url && item.url.startsWith('data:video')) {
          console.log(`      ✅ DATA URL - WILL WORK`);
        } else if (item.url && item.url.startsWith('data:image')) {
          console.log(`      ✅ DATA URL - WILL WORK`);
        }
      });
    } else {
      console.log(`   - Empty`);
    }
  });
}

checkLatest().then(() => {
  console.log('\n\n✅ Done!\n');
  process.exit(0);
});

