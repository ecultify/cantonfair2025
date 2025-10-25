const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://omtewsyzhlhhkmpyaqow.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGV3c3l6aGxoaGttcHlhcW93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE3OTQzMywiZXhwIjoyMDc2NzU1NDMzfQ.GpGP3SEWiw8bJy2tM6cBnewUQQ5ViaZYEUAlXzSJxTQ'
);

(async () => {
  try {
    const { data, error } = await supabase
      .from('quick_captures')
      .select('product_name, created_at, media_items')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    console.log('\nLatest 10 captures:\n');
    data.forEach((c, i) => {
      const time = new Date(c.created_at).toLocaleTimeString();
      const mediaCount = c.media_items ? c.media_items.length : 0;
      const firstMedia = c.media_items?.[0];
      const videoType = firstMedia?.url ? 
        (firstMedia.url.startsWith('blob:') ? 'BLOB ❌' : 
         firstMedia.url.startsWith('data:') ? 'DATA ✅' : 'OTHER') : 
        'NONE';
      
      console.log(`${i+1}. ${c.product_name.padEnd(30)} | ${time} | Media: ${mediaCount} | ${videoType}`);
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();

