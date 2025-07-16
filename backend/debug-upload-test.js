const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const token = '86EC85B8A85DEEE1';

// Create a small test file
const testContent = 'This is a test file for debugging upload issue.';
fs.writeFileSync('/tmp/test-upload.txt', testContent);

async function testUpload() {
  console.log('🔍 Testing upload for token:', token);
  
  const form = new FormData();
  form.append('files', fs.createReadStream('/tmp/test-upload.txt'), {
    filename: 'test-debug-upload.txt',
    contentType: 'text/plain'
  });

  const options = {
    hostname: 'onboardingmanager.onrender.com',
    port: 443,
    path: `/api/merchant-onboarding/upload-attachments/${token}`,
    method: 'POST',
    headers: {
      ...form.getHeaders(),
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📋 Upload Status Code:', res.statusCode);
      console.log('📋 Upload Response Headers:', res.headers);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const response = JSON.parse(data);
          console.log('✅ Upload successful!');
          console.log('  Response:', JSON.stringify(response, null, 2));
        } catch (error) {
          console.log('✅ Upload successful! Raw response:', data);
        }
      } else {
        console.error('❌ Upload failed with status:', res.statusCode);
        console.error('❌ Error response:', data);
      }
      
      // Clean up test file
      fs.unlinkSync('/tmp/test-upload.txt');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Upload request error:', error.message);
    // Clean up test file
    if (fs.existsSync('/tmp/test-upload.txt')) {
      fs.unlinkSync('/tmp/test-upload.txt');
    }
  });

  form.pipe(req);
}

testUpload(); 