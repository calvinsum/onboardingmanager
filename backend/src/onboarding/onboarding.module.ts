import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController, MerchantOnboardingController, FileDownloadController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { TermsConditionsService } from './terms-conditions.service';
import { Onboarding } from './entities/onboarding.entity';
import { TermsConditions } from './entities/terms-conditions.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { ProductSetupAttachment } from './entities/product-setup-attachment.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CloudinaryConfig } from '../config/cloudinary.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Onboarding, TermsConditions, Merchant, OnboardingManager, ProductSetupAttachment]),
  ],
  controllers: [OnboardingController, MerchantOnboardingController, FileDownloadController],
  providers: [OnboardingService, TermsConditionsService, CloudinaryService, CloudinaryConfig],
  exports: [OnboardingService, TermsConditionsService],
})
export class OnboardingModule {}
