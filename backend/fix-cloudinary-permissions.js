const { Pool } = require('pg');
const fetch = require('node-fetch');

async function fixCloudinaryPermissions() {
  console.log('🔧 Fixing Cloudinary file permissions...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Configure Cloudinary
    const cloudinary = require('cloudinary').v2;
    
    // Verify Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ Cloudinary environment variables not set');
      console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'NOT SET');
      console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'set' : 'NOT SET');
      console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'set' : 'NOT SET');
      return;
    }
    
    console.log('✅ Cloudinary credentials configured');
    
    // Get all attachments
    const result = await pool.query(`
      SELECT id, "originalName", "cloudinaryPublicId", "cloudinaryUrl"
      FROM product_setup_attachments 
      ORDER BY "uploadedAt" DESC
      LIMIT 10
    `);
    
    console.log(`📊 Found ${result.rows.length} recent attachments to process`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const attachment of result.rows) {
      console.log(`\n📎 Processing: ${attachment.originalName}`);
      console.log(`   Public ID: ${attachment.cloudinaryPublicId}`);
      
      try {
        // Step 1: Get current resource info
        console.log('   📋 Getting resource info...');
        const resourceInfo = await cloudinary.api.resource(attachment.cloudinaryPublicId, {
          resource_type: 'auto'
        });
        
        console.log(`   📊 Current access mode: ${resourceInfo.access_mode || 'public'}`);
        console.log(`   📊 Resource type: ${resourceInfo.resource_type}`);
        console.log(`   📊 Format: ${resourceInfo.format}`);
        
        // Step 2: If not public, try to make it public
        if (resourceInfo.access_mode !== 'public') {
          console.log('   🔄 Making resource public...');
          
          try {
            const updateResult = await cloudinary.api.update(attachment.cloudinaryPublicId, {
              access_mode: 'public',
              resource_type: 'auto'
            });
            console.log('   ✅ Successfully made public');
          } catch (updateError) {
            console.log('   ⚠️  Could not update access mode:', updateError.message);
          }
        }
        
        // Step 3: Generate and test new public URL
        console.log('   🔗 Generating new public URL...');
        const newPublicUrl = cloudinary.url(attachment.cloudinaryPublicId, {
          resource_type: 'auto',
          type: 'upload',
          secure: true,
          sign_url: false,
        });
        
        console.log(`   🧪 Testing URL: ${newPublicUrl.substring(0, 80)}...`);
        
        // Test the URL
        const testResponse = await fetch(newPublicUrl);
        console.log(`   📊 Test result: ${testResponse.status}`);
        
        if (testResponse.status === 200) {
          console.log('   ✅ URL is working! Updating database...');
          
          // Update database with working URL
          await pool.query(
            'UPDATE product_setup_attachments SET "cloudinaryUrl" = $1 WHERE id = $2',
            [newPublicUrl, attachment.id]
          );
          
          fixedCount++;
        } else {
          console.log(`   ❌ URL still not working: ${testResponse.status}`);
          
          // Try signed URL as backup
          console.log('   🔄 Trying signed URL approach...');
          const signedUrl = cloudinary.url(attachment.cloudinaryPublicId, {
            resource_type: 'auto',
            type: 'upload',
            secure: true,
            sign_url: true,
            timestamp: Math.floor(Date.now() / 1000),
          });
          
          const signedTest = await fetch(signedUrl);
          console.log(`   📊 Signed URL test: ${signedTest.status}`);
          
          if (signedTest.status === 200) {
            console.log('   ✅ Signed URL works - this confirms file exists but has access restrictions');
          }
          
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${result.rows.length}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Some files have been fixed! Test the download endpoints now.');
    } else if (errorCount > 0) {
      console.log('\n💡 All files seem to have access restrictions. The admin API approach in the backend should handle this.');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixCloudinaryPermissions();
}

module.exports = { fixCloudinaryPermissions }; 