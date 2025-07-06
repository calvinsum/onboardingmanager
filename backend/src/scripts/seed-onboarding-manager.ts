import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OnboardingManagerService } from '../onboarding-manager/onboarding-manager.service';
import { DataSource } from 'typeorm';
import { OnboardingManager, OnboardingManagerRole } from '../onboarding-manager/entities/onboarding-manager.entity';
import * as bcrypt from 'bcryptjs';

async function seedOnboardingManager() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const onboardingManagerRepository = dataSource.getRepository(OnboardingManager);
  
  // Check if any onboarding manager already exists
  const existingManager = await onboardingManagerRepository.findOne({
    where: {}
  });
  
  if (existingManager) {
    console.log('✅ Onboarding manager already exists:', existingManager.email);
    await app.close();
    return;
  }
  
  // Create default onboarding manager
  const defaultManager = onboardingManagerRepository.create({
    email: 'admin@storehub.com',
    password: await bcrypt.hash('DefaultPassword123!', 10),
    fullName: 'Default Admin',
    role: OnboardingManagerRole.ADMIN,
    isActive: true,
    oauthProvider: null, // This manager uses password login
  });
  
  await onboardingManagerRepository.save(defaultManager);
  
  console.log('✅ Default onboarding manager created successfully!');
  console.log('📧 Email: admin@storehub.com');
  console.log('🔑 Password: DefaultPassword123!');
  console.log('⚠️  IMPORTANT: Change this password immediately after first login');
  
  await app.close();
}

seedOnboardingManager().catch(error => {
  console.error('❌ Error seeding onboarding manager:', error);
  process.exit(1);
}); 