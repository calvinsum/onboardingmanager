const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const token = '657924F6C4A36E0C'; // 890 account token (status: created)

// Create a small test file
const testContent = `Test file uploaded at ${new Date().toISOString()}
This is to verify if our Cloudinary public access fix is working.`;
fs.writeFileSync('/tmp/test-public-access.txt', testContent);

async function testNewUpload() {
  console.log('🔍 Testing new upload with public access fix...');
  console.log('📝 Token:', token);
  
  const form = new FormData();
  form.append('files', fs.createReadStream('/tmp/test-public-access.txt'), {
    filename: 'test-public-access.txt',
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
          console.log('✅ Upload successful!');
          console.log('📎 New attachments:', response.attachmentCount);
          
          if (response.attachments && response.attachments.length > 0) {
            const newAttachment = response.attachments[response.attachments.length - 1];
            console.log('🔗 New file URL:', newAttachment.cloudinaryUrl);
            
            // Test the new URL
            console.log('\n🔍 Testing new file accessibility...');
            testFileAccess(newAttachment.cloudinaryUrl);
          }
        } catch (error) {
          console.log('✅ Upload successful! Raw response length:', data.length);
        }
      } else {
        console.error('❌ Upload failed with status:', res.statusCode);
        console.error('❌ Error response:', data);
      }
      
      // Clean up test file
      fs.unlinkSync('/tmp/test-public-access.txt');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Upload request error:', error.message);
    if (fs.existsSync('/tmp/test-public-access.txt')) {
      fs.unlinkSync('/tmp/test-public-access.txt');
    }
  });

  form.pipe(req);
}

function testFileAccess(url) {
  const https = require('https');
  const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`📊 File accessibility test:`);
    console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
    
    if (res.headers['x-cld-error']) {
      console.log(`   ❌ Cloudinary Error: ${res.headers['x-cld-error']}`);
    }
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('   ✅ File is publicly accessible!');
      console.log('   🎉 Our fix is working!');
    } else {
      console.log('   ❌ File is NOT accessible');
      console.log('   🔧 Our fix needs more work');
    }
  });

  req.on('error', (error) => {
    console.log(`   ❌ Network Error: ${error.message}`);
  });

  req.end();
}

testNewUpload(); 