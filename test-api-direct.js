const https = require('https');
const http = require('http');

// Test the OCR API
async function testAPI() {
  console.log('🔍 Testing OCR.space API with key: K87711251188957\n');
  
  // Simple test with base64 image of text "TEST"
  const testData = JSON.stringify({
    apikey: 'K87711251188957',
    base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    language: 'eng',
    OCREngine: '2'
  });

  const options = {
    hostname: 'api.ocr.space',
    path: '/parse/image',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': testData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`📥 Status Code: ${res.statusCode}\n`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📋 Full API Response:');
          console.log(JSON.stringify(result, null, 2));
          console.log('\n');
          
          if (result.IsErroredOnProcessing) {
            console.log('❌ OCR API ERROR DETECTED:');
            console.log(`   Error: ${result.ErrorMessage}`);
            console.log(`   Details: ${JSON.stringify(result.ErrorDetails)}`);
            
            if (result.ErrorMessage) {
              if (result.ErrorMessage.includes('limit') || result.ErrorMessage.includes('quota')) {
                console.log('\n💡 DIAGNOSIS: API key has reached rate limit');
              } else if (result.ErrorMessage.includes('invalid')) {
                console.log('\n💡 DIAGNOSIS: API key is invalid');
              }
            }
          } else if (result.OCRExitCode === 1 || result.ParsedResults) {
            console.log('✅ OCR API IS WORKING!');
            if (result.ParsedResults && result.ParsedResults[0]) {
              console.log(`   Extracted: ${result.ParsedResults[0].ParsedText}`);
            }
          } else {
            console.log('⚠️  Unknown response format');
          }
          
          resolve(result);
        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
          console.log('Raw response:', data);
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
      reject(e);
    });
    
    req.write(testData);
    req.end();
  });
}

// Check what's deployed on Vercel
async function checkDeployedVersion() {
  console.log('\n🌐 Checking deployed version at cantonfair2025.vercel.app...\n');
  
  const options = {
    hostname: 'cantonfair2025.vercel.app',
    path: '/',
    method: 'GET'
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`📥 Status: ${res.statusCode}`);
      console.log(`📅 Last-Modified: ${res.headers['last-modified']}`);
      console.log(`🔧 Deployment: ${res.headers['x-vercel-id'] || 'N/A'}`);
      console.log(`⏰ Age: ${res.headers['age'] || 'N/A'} seconds\n`);
      resolve();
    });
    
    req.on('error', (e) => {
      console.error('❌ Failed to check deployed version:', e.message);
      resolve();
    });
    
    req.end();
  });
}

// Run tests
(async () => {
  try {
    await testAPI();
    await checkDeployedVersion();
    console.log('\n✅ Tests complete!\n');
  } catch (e) {
    console.error('Test failed:', e);
  }
})();

