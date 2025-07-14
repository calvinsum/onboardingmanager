const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugFileUpload() {
  try {
    console.log('1. Testing API health...');
    const healthResponse = await fetch('https://onboardingmanager.onrender.com/api/health');
    const healthData = await healthResponse.json();
    console.log('   API Status:', healthData.status);
    console.log('   Database:', healthData.database);
    
    console.log('\n2. Testing file upload endpoint...');
    
    // Create a simple test file
    const testContent = 'This is a test file for upload debugging';
    fs.writeFileSync('debug-test.txt', testContent);
    
    // Create form data
    const formData = new FormData();
    formData.append('files', fs.createReadStream('debug-test.txt'));
    
    console.log('   Uploading to: https://onboardingmanager.onrender.com/api/merchant-onboarding/upload-attachments/DEBUG-TOKEN');
    
    const response = await fetch('https://onboardingmanager.onrender.com/api/merchant-onboarding/upload-attachments/DEBUG-TOKEN', {
      method: 'POST',
      body: formData,
    });
    
    console.log('   Response Status:', response.status);
    console.log('   Response Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('   Response Body:', responseText);
    
    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('   Parsed JSON:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('   Could not parse as JSON');
    }
    
    // Clean up
    fs.unlinkSync('debug-test.txt');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugFileUpload(); 