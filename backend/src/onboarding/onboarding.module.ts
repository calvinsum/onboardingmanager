import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController, MerchantOnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { Onboarding } from './entities/onboarding.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Onboarding, Merchant, OnboardingManager]),
  ],
  controllers: [OnboardingController, MerchantOnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {} 