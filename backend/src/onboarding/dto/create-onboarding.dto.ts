import { IsNotEmpty, IsString, IsEmail, IsDateString, IsBoolean, IsArray, IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OnboardingType } from '../entities/onboarding.entity';

export class CreateOnboardingDto {
  @ApiProperty({ 
    description: 'Onboarding types', 
    enum: OnboardingType,
    isArray: true,
    example: [OnboardingType.HARDWARE_DELIVERY, OnboardingType.REMOTE_TRAINING]
  })
  @IsArray()
  @IsEnum(OnboardingType, { each: true })
  @IsNotEmpty()
  onboardingTypes: OnboardingType[];

  @ApiProperty({ description: 'Account name', example: 'ABC Trading Sdn Bhd' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ description: 'Delivery confirmation status', required: false })
  @IsOptional()
  @IsBoolean()
  deliveryConfirmed?: boolean;

  @ApiProperty({ description: 'Date when delivery was confirmed', required: false })
  @IsOptional()
  @IsDateString()
  deliveryConfirmedDate?: string;

  @ApiProperty({ description: 'Installation confirmation status', required: false })
  @IsOptional()
  @IsBoolean()
  installationConfirmed?: boolean;

  @ApiProperty({ description: 'Date when installation was confirmed', required: false })
  @IsOptional()
  @IsDateString()
  installationConfirmedDate?: string;

  // Delivery Address
  @ApiProperty({ description: 'Delivery address line 1', example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress1: string;

  @ApiProperty({ description: 'Delivery address line 2', required: false, example: 'Unit 5A' })
  @IsOptional()
  @IsString()
  deliveryAddress2?: string;

  @ApiProperty({ description: 'Delivery city', example: 'Kuala Lumpur' })
  @IsString()
  @IsNotEmpty()
  deliveryCity: string;

  @ApiProperty({ description: 'Delivery state', example: 'Selangor' })
  @IsString()
  @IsNotEmpty()
  deliveryState: string;

  @ApiProperty({ description: 'Delivery postal code', example: '50000' })
  @IsString()
  @IsNotEmpty()
  deliveryPostalCode: string;

  @ApiProperty({ description: 'Delivery country', example: 'Malaysia' })
  @IsString()
  @IsNotEmpty()
  deliveryCountry: string;

  // Training Address
  @ApiProperty({ description: 'Use same address for training', example: true })
  @IsBoolean()
  useSameAddressForTraining: boolean;

  @ApiProperty({ description: 'Training address line 1', required: false, example: '456 Training Street' })
  @ValidateIf((o) => !o.useSameAddressForTraining)
  @IsString()
  @IsNotEmpty()
  trainingAddress1?: string;

  @ApiProperty({ description: 'Training address line 2', required: false, example: 'Floor 2' })
  @ValidateIf((o) => !o.useSameAddressForTraining)
  @IsOptional()
  @IsString()
  trainingAddress2?: string;

  @ApiProperty({ description: 'Training city', required: false, example: 'Petaling Jaya' })
  @ValidateIf((o) => !o.useSameAddressForTraining)
  @IsString()
  @IsNotEmpty()
  trainingCity?: string;

  @ApiProperty({ description: 'Training state', required: false, example: 'Selangor' })
  @ValidateIf((o) => !o.useSameAddressForTraining)
  @IsString()
  @IsNotEmpty()
  trainingState?: string;

  @ApiProperty({ description: 'Training postal code', required: false, example: '47000' })
  @ValidateIf((o) => !o.useSameAddressForTraining)
  @IsString()
  @IsNotEmpty()
  trainingPostalCode?: string;

  @ApiProperty({ description: 'Training country', required: false, example: 'Malaysia' })
  @ValidateIf((o) => !o.useSameAddressForTraining)
  @IsString()
  @IsNotEmpty()
  trainingCountry?: string;

  @ApiProperty({ 
    description: 'Training preference languages', 
    isArray: true,
    required: false,
    example: ['English', 'Malay']
  })
  @IsOptional() // This allows the property to be entirely missing
  @IsArray()
  @IsString({ each: true })
  @ValidateIf(o => o.trainingPreferenceLanguages !== undefined) // Only validate if the array is present
  trainingPreferenceLanguages?: string[];

  // PIC Details
  @ApiProperty({ description: 'Person in charge name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  picName: string;

  @ApiProperty({ description: 'Person in charge phone', example: '+60123456789' })
  @IsString()
  @IsNotEmpty()
  picPhone: string;

  @ApiProperty({ description: 'Person in charge email', example: 'john.doe@merchant.com' })
  @IsEmail()
  @IsNotEmpty()
  picEmail: string;

  // Expected Go Live Date
  @ApiProperty({ description: 'Expected go live date', example: '2024-02-15' })
  @IsDateString()
  @IsNotEmpty()
  expectedGoLiveDate: string;
} 