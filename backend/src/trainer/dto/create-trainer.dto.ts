import { IsNotEmpty, IsString, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TrainerLanguage } from '../entities/trainer.entity';

export class CreateTrainerDto {
  @ApiProperty({ description: 'Trainer name', example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Languages spoken by trainer', 
    enum: TrainerLanguage,
    isArray: true,
    example: [TrainerLanguage.ENGLISH, TrainerLanguage.MALAY]
  })
  @IsArray()
  @IsEnum(TrainerLanguage, { each: true })
  @IsNotEmpty()
  languages: TrainerLanguage[];

  @ApiProperty({ 
    description: 'States where trainer is available', 
    isArray: true,
    example: ['Kuala Lumpur', 'Selangor', 'Penang']
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  locations: string[];
} 