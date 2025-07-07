import { PartialType } from '@nestjs/swagger';
import { CreateOnboardingDto } from './create-onboarding.dto';
import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOnboardingDto extends PartialType(CreateOnboardingDto) {
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