import { PartialType } from '@nestjs/swagger';
import { CreateTrainerDto } from './create-trainer.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TrainerStatus } from '../entities/trainer.entity';

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {
  @ApiProperty({ 
    description: 'Trainer availability status', 
    enum: TrainerStatus,
    required: false 
  })
  @IsOptional()
  @IsEnum(TrainerStatus)
  status?: TrainerStatus;
} 