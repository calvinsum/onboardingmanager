const https = require('https');

// Test the specific failing token
const token = '86EC85B8A85DEEE1';

async function testToken() {
  console.log('🔍 Testing token:', token);
  
  // First, get the onboarding details
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

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📋 Status Code:', res.statusCode);
      console.log('📋 Response Headers:', res.headers);
      
      if (res.statusCode === 200) {
        try {
          const onboarding = JSON.parse(data);
          console.log('✅ Found onboarding record:');
          console.log('  ID:', onboarding.id);
          console.log('  Account:', onboarding.accountName);
          console.log('  Status:', onboarding.status);
          console.log('  Token Expiry:', onboarding.tokenExpiryDate);
          console.log('  Product Setup Confirmed:', onboarding.productSetupConfirmed);
          console.log('  Existing Attachments:', onboarding.productSetupAttachments?.length || 0);
          
          if (onboarding.productSetupAttachments?.length > 0) {
            onboarding.productSetupAttachments.forEach((att, i) => {
              console.log(`    ${i + 1}:`, att.originalName, '- uploaded at', att.uploadedAt);
            });
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.log('Raw response:', data);
        }
      } else {
        console.error('❌ Error response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

testToken(); 