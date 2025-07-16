const { Pool } = require('pg');
const fetch = require('node-fetch');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fixFileUrls() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 
      `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking all attachment file URLs...');
    
    // Get all attachments
    const result = await pool.query(`
      SELECT id, "originalName", "cloudinaryPublicId", "cloudinaryUrl", "mimeType"
      FROM product_setup_attachments 
      ORDER BY "uploadedAt" DESC
    `);
    
    console.log(`📊 Found ${result.rows.length} attachments to check`);
    
    let fixedCount = 0;
    let workingCount = 0;
    let errorCount = 0;
    
    for (const attachment of result.rows) {
      console.log(`\n📎 Checking: ${attachment.originalName} (${attachment.id})`);
      console.log(`   Current URL: ${attachment.cloudinaryUrl}`);
      
      try {
        // Test current URL
        const response = await fetch(attachment.cloudinaryUrl);
        console.log(`   Current URL status: ${response.status}`);
        
        if (response.status === 200) {
          console.log('   ✅ Current URL is working');
          workingCount++;
          continue;
        }
        
        // Generate new public URL
        console.log('   🔄 Generating new public URL...');
        const newUrl = cloudinary.url(attachment.cloudinaryPublicId, {
          type: 'upload',
          secure: true,
          sign_url: false,
        });
        
        console.log(`   New URL: ${newUrl}`);
        
        // Test new URL
        const newResponse = await fetch(newUrl);
        console.log(`   New URL status: ${newResponse.status}`);
        
        if (newResponse.status === 200) {
          console.log('   🔧 Updating URL in database...');
          await pool.query(
            'UPDATE product_setup_attachments SET "cloudinaryUrl" = $1 WHERE id = $2',
            [newUrl, attachment.id]
          );
          console.log('   ✅ URL updated successfully');
          fixedCount++;
        } else {
          console.log('   ❌ New URL also not working');
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking file: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Working URLs: ${workingCount}`);
    console.log(`   🔧 Fixed URLs: ${fixedCount}`);
    console.log(`   ❌ Error URLs: ${errorCount}`);
    console.log(`   📊 Total checked: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixFileUrls();
}

module.exports = { fixFileUrls }; 