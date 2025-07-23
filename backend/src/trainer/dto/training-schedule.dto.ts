import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TrainingType, SlotStatus } from '../entities/training-slot.entity';

// Base training slot information (common to both views)
export class BaseTrainingSlotDto {
  @ApiProperty({ description: 'Training slot ID' })
  id: string;

  @ApiProperty({ description: 'Training date' })
  date: Date;

  @ApiProperty({ description: 'Time slot (e.g., 09:00, 14:30)' })
  timeSlot: string;

  @ApiProperty({ description: 'Training type', enum: TrainingType })
  trainingType: TrainingType;

  @ApiProperty({ description: 'Training location (state) for onsite training' })
  location: string;

  @ApiProperty({ description: 'Training languages required', isArray: true })
  languages: string[];

  @ApiProperty({ description: 'Slot status', enum: SlotStatus })
  status: SlotStatus;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

// Merchant view - NO trainer information exposed
export class MerchantTrainingSlotDto extends BaseTrainingSlotDto {
  @ApiProperty({ description: 'Training assigned status' })
  isAssigned: boolean;

  @ApiProperty({ description: 'Account name for this training' })
  accountName?: string;

  @ApiProperty({ description: 'Training confirmation status' })
  trainingConfirmed: boolean;
}

// Manager view - Full trainer and onboarding details
export class ManagerTrainingSlotDto extends BaseTrainingSlotDto {
  @ApiProperty({ description: 'Assigned trainer details' })
  trainer: {
    id: string;
    name: string;
    languages: string[];
    locations: string[];
    status: string;
  };

  @ApiProperty({ description: 'Onboarding record details' })
  onboarding: {
    id: string;
    accountName: string;
    picName: string;
    picEmail: string;
    picPhone: string;
    trainingConfirmed: boolean;
    deliveryState: string;
    trainingState: string;
    // Training address fields
    useSameAddressForTraining: boolean;
    trainingAddress1?: string;
    trainingAddress2?: string;
    trainingCity?: string;
    trainingPostalCode?: string;
    trainingCountry?: string;
  };
}

// Training schedule list response for managers
export class TrainingScheduleListDto {
  @ApiProperty({ description: 'List of training slots', type: [ManagerTrainingSlotDto] })
  trainingSlots: ManagerTrainingSlotDto[];

  @ApiProperty({ description: 'Total count of training slots' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

// Auto-assign booking request DTO
export class AutoAssignTrainingSlotDto {
  @ApiProperty({ description: 'Onboarding record ID' })
  @IsString()
  onboardingId: string;

  @ApiProperty({ description: 'Training date' })
  @IsString()
  date: string;

  @ApiProperty({ description: 'Time slot' })
  @IsString()
  timeSlot: string;

  @ApiProperty({ description: 'Training type', enum: TrainingType })
  @IsEnum(TrainingType)
  trainingType: TrainingType;

  @ApiProperty({ description: 'Location for onsite training', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Required languages', isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}

// Trainer workload statistics DTO
export class TrainerWorkloadDto {
  @ApiProperty({ description: 'Trainer ID' })
  trainerId: string;

  @ApiProperty({ description: 'Trainer name' })
  trainerName: string;

  @ApiProperty({ description: 'Number of assignments in period' })
  assignmentCount: number;

  @ApiProperty({ description: 'Trainer languages', isArray: true })
  languages: string[];

  @ApiProperty({ description: 'Trainer locations', isArray: true })
  locations: string[];

  @ApiProperty({ description: 'Trainer status' })
  status: string;
}

// Training schedule filters DTO
export class TrainingScheduleFiltersDto {
  @ApiProperty({ description: 'Start date filter', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: 'End date filter', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: 'Trainer ID filter', required: false })
  @IsOptional()
  @IsString()
  trainerId?: string;

  @ApiProperty({ description: 'Training status filter', required: false, enum: SlotStatus })
  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @ApiProperty({ description: 'Training type filter', required: false, enum: TrainingType })
  @IsOptional()
  @IsEnum(TrainingType)
  trainingType?: TrainingType;

  @ApiProperty({ description: 'Location filter', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Page number', required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
} 