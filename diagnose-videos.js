const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://omtewsyzhlhhkmpyaqow.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGV3c3l6aGxoaGttcHlhcW93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE3OTQzMywiZXhwIjoyMDc2NzU1NDMzfQ.GpGP3SEWiw8bJy2tM6cBnewUQQ5ViaZYEUAlXzSJxTQ'
);

(async () => {
  const { data } = await supabase
    .from('quick_captures')
    .select('*')
    .in('product_name', ['Water system', 'Wall', 'Cactus artificial'])
    .order('created_at', { ascending: false });
  
  console.log('\n🔍 DETAILED VIDEO ANALYSIS:\n');
  
  data.forEach(c => {
    const time = new Date(c.created_at).toLocaleString();
    const media = c.media_items?.[0];
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Product: ${c.product_name}`);
    console.log(`Time: ${time}`);
    
    if (media?.url) {
      const urlStart = media.url.substring(0, 100);
      const isBlob = media.url.startsWith('blob:');
      const isData = media.url.startsWith('data:');
      
      console.log(`\nVideo URL Analysis:`);
      console.log(`  Type: ${media.type}`);
      console.log(`  URL Length: ${media.url.length} chars`);
      console.log(`  URL Start: ${urlStart}`);
      console.log(`  Is Blob URL: ${isBlob ? '❌ YES (BROKEN)' : '✅ NO'}`);
      console.log(`  Is Data URL: ${isData ? '✅ YES (WORKING)' : '❌ NO'}`);
      
      if (isData) {
        // Check if it's properly encoded
        const hasBase64 = media.url.includes('base64,');
        const sizeKB = Math.round(media.url.length / 1024);
        console.log(`  Has base64 marker: ${hasBase64 ? '✅ YES' : '❌ NO'}`);
        console.log(`  Approximate size: ${sizeKB} KB`);
        
        // Extract format
        const formatMatch = media.url.match(/data:([^;]+)/);
        if (formatMatch) {
          console.log(`  Format: ${formatMatch[1]}`);
        }
      }
      
      if (isBlob) {
        console.log(`\n  ⚠️  PROBLEM: This video was saved as blob URL`);
        console.log(`     Blob URL: ${media.url}`);
        console.log(`     This means conversion DIDN'T run or FAILED`);
      }
    } else {
      console.log(`\n❌ No media URL`);
    }
  });
  
  console.log(`\n${'='.repeat(70)}\n`);
  
  // Timeline
  console.log('📅 TIMELINE ANALYSIS:\n');
  data.reverse().forEach((c, i) => {
    const time = new Date(c.created_at);
    const media = c.media_items?.[0];
    const status = media?.url?.startsWith('data:') ? '✅ DATA' : 
                   media?.url?.startsWith('blob:') ? '❌ BLOB' : '⚠️  NONE';
    console.log(`${i+1}. ${time.toLocaleTimeString()} - ${c.product_name.padEnd(25)} ${status}`);
  });
  
  console.log('\n💡 CONCLUSION:');
  console.log('If blob URLs appear AFTER a successful data URL capture,');
  console.log('this indicates:');
  console.log('  1. User is using CACHED old version (didn\'t refresh)');
  console.log('  2. OR multiple devices with different deployment versions');
  console.log('  3. OR the conversion is failing silently\n');
  
  process.exit(0);
})();

