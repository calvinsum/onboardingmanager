import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { ProductSetupAttachment } from '../onboarding/entities/product-setup-attachment.entity';
import { CloudinaryService } from '../common/services/cloudinary.service';

async function fixAttachmentUrls() {
  console.log('🚀 Starting attachment URL migration script...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  const cloudinaryService = app.get(CloudinaryService);
  const attachmentRepository = dataSource.getRepository(ProductSetupAttachment);

  const allAttachments = await attachmentRepository.find();
  console.log(`🔍 Found ${allAttachments.length} attachments to process.`);

  let updatedCount = 0;
  for (const attachment of allAttachments) {
    try {
      console.log(`\nProcessing attachment ID: ${attachment.id}`);
      console.log(`  Old URL: ${attachment.cloudinaryUrl}`);
      
      const newUrl = cloudinaryService.getPublicFileUrl(attachment.cloudinaryPublicId);
      
      if (newUrl !== attachment.cloudinaryUrl) {
        console.log(`  ✅ New URL generated: ${newUrl}`);
        attachment.cloudinaryUrl = newUrl;
        await attachmentRepository.save(attachment);
        updatedCount++;
        console.log(`  💾 Attachment updated successfully.`);
      } else {
        console.log(`  👌 URL is already correct. Skipping.`);
      }
    } catch (error) {
      console.error(`❌ Failed to process attachment ${attachment.id}:`, error.message);
    }
  }

  console.log(`\n\n✅ Migration complete!`);
  console.log(`Total attachments processed: ${allAttachments.length}`);
  console.log(`Total attachments updated: ${updatedCount}`);

  await app.close();
}

fixAttachmentUrls().catch(error => {
  console.error('❌ An unexpected error occurred during the migration:', error);
  process.exit(1);
}); 