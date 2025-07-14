import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController, MerchantOnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { TermsConditionsService } from './terms-conditions.service';
import { Onboarding } from './entities/onboarding.entity';
import { TermsConditions } from './entities/terms-conditions.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Onboarding, TermsConditions, Merchant, OnboardingManager]),
  ],
  controllers: [OnboardingController, MerchantOnboardingController],
  providers: [OnboardingService, TermsConditionsService],
  exports: [OnboardingService, TermsConditionsService],
})
export class OnboardingModule {} 