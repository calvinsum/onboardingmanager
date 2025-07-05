import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingManagerController } from './onboarding-manager.controller';
import { OnboardingManagerService } from './onboarding-manager.service';
import { OnboardingManager } from './entities/onboarding-manager.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OnboardingManager])],
  controllers: [OnboardingManagerController],
  providers: [OnboardingManagerService],
  exports: [OnboardingManagerService],
})
export class OnboardingManagerModule {} 