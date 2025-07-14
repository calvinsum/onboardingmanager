const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFileUpload() {
  try {
    // Create a simple test file
    const testContent = 'This is a test file for upload';
    fs.writeFileSync('test-file.txt', testContent);
    
    // Create form data
    const formData = new FormData();
    formData.append('files', fs.createReadStream('test-file.txt'));
    
    // Test with a dummy token (this will fail but we can see the error)
    const response = await fetch('https://onboardingmanager.onrender.com/api/merchant-onboarding/upload-attachments/test-token', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    // Clean up
    fs.unlinkSync('test-file.txt');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFileUpload(); 