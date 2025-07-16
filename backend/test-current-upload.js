const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const token = '657924F6C4A36E0C';

// Create a small test file
const testContent = `Test upload ${new Date().toISOString()} - Additional file test`;
fs.writeFileSync('/tmp/test-additional-upload.txt', testContent);

async function testAdditionalUpload() {
  console.log('🔍 Testing additional upload for token:', token);
  
  const form = new FormData();
  form.append('files', fs.createReadStream('/tmp/test-additional-upload.txt'), {
    filename: 'additional-test-file.txt',
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
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const response = JSON.parse(data);
          console.log('✅ Additional upload successful!');
          console.log('  Account:', response.accountName);
          console.log('  Status:', response.status);
          console.log('  Total attachments:', response.attachmentCount);
          console.log('  Latest attachment:', response.attachments[response.attachments.length - 1]?.originalName);
        } catch (error) {
          console.log('✅ Upload successful! Raw response:', data.substring(0, 200) + '...');
        }
      } else {
        console.error('❌ Upload failed with status:', res.statusCode);
        console.error('❌ Error response:', data);
      }
      
      // Clean up test file
      fs.unlinkSync('/tmp/test-additional-upload.txt');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Upload request error:', error.message);
    // Clean up test file
    if (fs.existsSync('/tmp/test-additional-upload.txt')) {
      fs.unlinkSync('/tmp/test-additional-upload.txt');
    }
  });

  form.pipe(req);
}

testAdditionalUpload(); 