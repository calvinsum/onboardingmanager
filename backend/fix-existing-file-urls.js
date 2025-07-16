const { Pool } = require('pg');
const fetch = require('node-fetch');

async function fixExistingFileUrls() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Fixing existing file URLs in database...');
    
    // Get all attachments with their current URLs
    const result = await pool.query(`
      SELECT id, "originalName", "cloudinaryPublicId", "cloudinaryUrl"
      FROM product_setup_attachments 
      ORDER BY "uploadedAt" DESC
    `);
    
    console.log(`📊 Found ${result.rows.length} attachments to fix`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const attachment of result.rows) {
      console.log(`\n📎 Processing: ${attachment.originalName}`);
      console.log(`   Current URL: ${attachment.cloudinaryUrl}`);
      console.log(`   Public ID: ${attachment.cloudinaryPublicId}`);
      
      try {
        // Extract cloud name from existing URL
        const cloudNameMatch = attachment.cloudinaryUrl.match(/https:\/\/res\.cloudinary\.com\/([^\/]+)\//);
        if (!cloudNameMatch) {
          console.log('   ❌ Could not extract cloud name from URL');
          errorCount++;
          continue;
        }
        
        const cloudName = cloudNameMatch[1];
        console.log(`   Cloud name: ${cloudName}`);
        
        // Generate new public URL without authentication
        const newUrl = `https://res.cloudinary.com/${cloudName}/auto/upload/${attachment.cloudinaryPublicId}`;
        console.log(`   New URL: ${newUrl}`);
        
        // Test the new URL
        console.log('   🧪 Testing new URL...');
        const testResponse = await fetch(newUrl);
        console.log(`   Test status: ${testResponse.status}`);
        
        if (testResponse.status === 200) {
          console.log('   ✅ New URL works! Updating database...');
          
          // Update the URL in database
          await pool.query(
            'UPDATE product_setup_attachments SET "cloudinaryUrl" = $1 WHERE id = $2',
            [newUrl, attachment.id]
          );
          
          console.log('   ✅ Database updated successfully');
          fixedCount++;
          
        } else if (testResponse.status === 404) {
          // Try alternative URL formats
          console.log('   🔄 Trying alternative formats...');
          
          const alternativeUrls = [
            // Try with raw resource type for PDFs
            `https://res.cloudinary.com/${cloudName}/raw/upload/${attachment.cloudinaryPublicId}`,
            // Try with image resource type
            `https://res.cloudinary.com/${cloudName}/image/upload/${attachment.cloudinaryPublicId}`,
            // Try with video resource type
            `https://res.cloudinary.com/${cloudName}/video/upload/${attachment.cloudinaryPublicId}`,
          ];
          
          let foundWorking = false;
          for (const altUrl of alternativeUrls) {
            console.log(`   Testing: ${altUrl}`);
            const altResponse = await fetch(altUrl);
            console.log(`   Status: ${altResponse.status}`);
            
            if (altResponse.status === 200) {
              console.log('   ✅ Alternative URL works! Updating...');
              
              await pool.query(
                'UPDATE product_setup_attachments SET "cloudinaryUrl" = $1 WHERE id = $2',
                [altUrl, attachment.id]
              );
              
              fixedCount++;
              foundWorking = true;
              break;
            }
          }
          
          if (!foundWorking) {
            console.log('   ❌ No working URL found');
            errorCount++;
          }
          
        } else {
          console.log(`   ❌ New URL returned ${testResponse.status}`);
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing attachment: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Fix Summary:`);
    console.log(`   ✅ Fixed URLs: ${fixedCount}`);
    console.log(`   ❌ Error URLs: ${errorCount}`);
    console.log(`   📊 Total processed: ${result.rows.length}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 File URLs have been fixed! Users should now be able to view/download files.');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixExistingFileUrls();
}

module.exports = { fixExistingFileUrls }; 