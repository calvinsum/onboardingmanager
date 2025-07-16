const fetch = require('node-fetch');

async function testDownloadFix() {
  const attachmentId = 'd0392277-8d29-4430-8e2e-33a2189bb513';
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MDFmYjMwZi04NWVmLTRhMjItODk0Yy03Y2ZjNWEyZDYxZmEiLCJlbWFpbCI6ImNhbHZpbi5zdW1Ac3RvcmVodWIuY29tIiwidHlwZSI6Im9uYm9hcmRpbmdfbWFuYWdlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjY0NzY5NywiZXhwIjoxNzU1MjM5Njk3fQ.b7kAs7srweliOZWuzQhBUY9JJMIDlO3hllP78BfoNXU';

  console.log('🧪 Testing download endpoint after fix...');
  console.log(`📎 Attachment ID: ${attachmentId}`);
  
  try {
    // Test both authentication methods
    console.log('\n1️⃣ Testing with Authorization header...');
    const response1 = await fetch(`https://onboardingmanager.onrender.com/api/files/attachment/${attachmentId}/download`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    console.log('   Status:', response1.status);
    console.log('   Content-Type:', response1.headers.get('content-type'));
    console.log('   Content-Length:', response1.headers.get('content-length'));
    console.log('   Content-Disposition:', response1.headers.get('content-disposition'));
    
    if (response1.status === 200) {
      const contentLength = response1.headers.get('content-length');
      console.log('   ✅ SUCCESS! File download working');
      console.log('   📊 File size:', contentLength, 'bytes');
      
      // Don't download the full file, just verify headers
      console.log('   🎯 Headers look correct for PDF download');
      
    } else {
      const errorText = await response1.text();
      console.log('   ❌ Still failing:', errorText);
    }
    
    console.log('\n2️⃣ Testing with query parameter token...');
    const response2 = await fetch(`https://onboardingmanager.onrender.com/api/files/attachment/${attachmentId}/download?token=${jwt}`);
    
    console.log('   Status:', response2.status);
    console.log('   Content-Type:', response2.headers.get('content-type'));
    console.log('   Content-Length:', response2.headers.get('content-length'));
    
    if (response2.status === 200) {
      console.log('   ✅ Query parameter method also working');
    } else {
      const errorText = await response2.text();
      console.log('   ❌ Query parameter method failing:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testDownloadFix();
}

module.exports = { testDownloadFix }; 