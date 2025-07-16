const https = require('https');

async function testSuperkitchenFiles() {
  console.log('🔍 Searching for superkitchen onboarding records...');
  
  // List of possible superkitchen-related tokens to check
  // (We'll need to check a few recent ones to find the right one)
  const possibleTokens = [
    '86EC85B8A85DEEE1', // From earlier error
    '657924F6C4A36E0C', // From earlier error  
    'FB9259293FB9FB90', // From the manager dashboard screenshot
  ];
  
  for (const token of possibleTokens) {
    console.log(`\n🔍 Testing token: ${token}`);
    
    try {
      const onboardingData = await getOnboardingDetails(token);
      console.log(`✅ Found onboarding: ${onboardingData.accountName}`);
      console.log(`   Status: ${onboardingData.status}`);
      console.log(`   Attachments: ${onboardingData.productSetupAttachments?.length || 0}`);
      
      // Test ALL records with attachments to identify the file access issue
      if (onboardingData.productSetupAttachments?.length > 0) {
        console.log(`\n📋 Testing attachments for: ${onboardingData.accountName}`);
        
        for (let i = 0; i < onboardingData.productSetupAttachments.length; i++) {
          const attachment = onboardingData.productSetupAttachments[i];
          console.log(`\n📎 Testing attachment ${i + 1}: ${attachment.originalName}`);
          console.log(`   URL: ${attachment.cloudinaryUrl}`);
          console.log(`   Uploaded: ${attachment.uploadedAt}`);
          
          const isAccessible = await testFileUrl(attachment.cloudinaryUrl);
          if (isAccessible) {
            console.log(`   ✅ File is accessible`);
          } else {
            console.log(`   ❌ File is NOT accessible - this is the problem!`);
          }
        }
      } else {
        console.log('   No attachments found');
      }
      
    } catch (error) {
      console.log(`   ❌ Token ${token} failed: ${error.message}`);
    }
  }
}

function getOnboardingDetails(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'onboardingmanager.onrender.com',
      port: 443,
      path: `/api/merchant-onboarding/details/${token}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function testFileUrl(url) {
  return new Promise((resolve) => {
    const https = require('https');
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      // Check if the response is successful (2xx status codes)
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      console.log(`     Status: ${res.statusCode} ${res.statusMessage}`);
      if (res.headers['x-cld-error']) {
        console.log(`     Cloudinary Error: ${res.headers['x-cld-error']}`);
      }
      resolve(isSuccess);
    });

    req.on('error', (error) => {
      console.log(`     Network Error: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

testSuperkitchenFiles(); 