import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OnboardingManager } from '../../onboarding-manager/entities/onboarding-manager.entity';

export enum TrainerLanguage {
  ENGLISH = 'English',
  MALAY = 'Malay',
  CHINESE = 'Chinese',
}

export enum TrainerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('trainers')
export class Trainer {
  @ApiProperty({ description: 'Trainer ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Trainer name' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Languages spoken by trainer', enum: TrainerLanguage, isArray: true })
  @Column('simple-array')
  languages: TrainerLanguage[];

  @ApiProperty({ description: 'States where trainer is available', isArray: true })
  @Column('simple-array')
  locations: string[];

  @ApiProperty({ description: 'Trainer availability status', enum: TrainerStatus })
  @Column({
    type: 'varchar',
    default: TrainerStatus.ACTIVE,
  })
  status: TrainerStatus;

  // Relationships
  @ApiProperty({ description: 'Created by onboarding manager', type: () => OnboardingManager })
  @ManyToOne(() => OnboardingManager, (manager) => manager.createdTrainers, { nullable: true })
  @JoinColumn({ name: 'createdByManagerId' })
  createdByManager: OnboardingManager;

  @Column({ nullable: true })
  createdByManagerId: string;

  @ApiProperty({ description: 'Created timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
} 