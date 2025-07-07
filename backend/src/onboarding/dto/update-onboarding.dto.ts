import { PartialType } from '@nestjs/swagger';
import { CreateOnboardingDto } from './create-onboarding.dto';
import { IsOptional, IsDateString, IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOnboardingDto extends PartialType(CreateOnboardingDto) {
  @ApiProperty({ description: 'Account name', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountName?: string;

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

  @ApiProperty({ description: 'Training confirmation status', required: false })
  @IsOptional()
  @IsBoolean()
  trainingConfirmed?: boolean;

  @ApiProperty({ description: 'Date when training was confirmed', required: false })
  @IsOptional()
  @IsDateString()
  trainingConfirmedDate?: string;

  @ApiProperty({ description: 'Scheduled date for hardware delivery', required: false })
  @IsOptional()
  @IsDateString()
  hardwareDeliveryDate?: string;

  @ApiProperty({ description: 'Scheduled date and time for hardware installation', required: false })
  @IsOptional()
  @IsDateString()
  hardwareInstallationDate?: string;

  @ApiProperty({ description: 'Scheduled date and time for training', required: false })
  @IsOptional()
  @IsDateString()
  trainingDate?: string;
} 