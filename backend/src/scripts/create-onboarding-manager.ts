import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { OnboardingManager, OnboardingManagerRole } from '../onboarding-manager/entities/onboarding-manager.entity';

async function createOnboardingManager() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const onboardingManagerRepository = dataSource.getRepository(OnboardingManager);
  
  // Check if calvin.sum@storehub.com already exists
  const existingManager = await onboardingManagerRepository.findOne({
    where: { email: 'calvin.sum@storehub.com' }
  });
  
  if (existingManager) {
    console.log('✅ Onboarding manager already exists:', existingManager.email);
    console.log('Manager details:', {
      id: existingManager.id,
      email: existingManager.email,
      fullName: existingManager.fullName,
      role: existingManager.role,
      isActive: existingManager.isActive
    });
    
    // Update to ensure it's active
    existingManager.isActive = true;
    await onboardingManagerRepository.save(existingManager);
    console.log('✅ Ensured manager is active');
  } else {
    // Create new onboarding manager
    const newManager = onboardingManagerRepository.create({
      email: 'calvin.sum@storehub.com',
      fullName: 'Calvin Sum',
      role: OnboardingManagerRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await onboardingManagerRepository.save(newManager);
    console.log('✅ Created new onboarding manager:', newManager.email);
    console.log('Manager details:', {
      id: newManager.id,
      email: newManager.email,
      fullName: newManager.fullName,
      role: newManager.role,
      isActive: newManager.isActive
    });
  }
  
  await app.close();
  console.log('✅ Script completed successfully');
}

createOnboardingManager().catch(error => {
  console.error('❌ Error creating onboarding manager:', error);
  process.exit(1);
}); 