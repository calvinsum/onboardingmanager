import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Trainer } from './trainer.entity';
import { Onboarding } from '../../onboarding/entities/onboarding.entity';

export enum TrainingType {
  REMOTE = 'remote_training',
  ONSITE = 'onsite_training',
}

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('training_slots')
@Index(['date', 'timeSlot'], { unique: false })
export class TrainingSlot {
  @ApiProperty({ description: 'Training slot ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Training date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Time slot (e.g., 09:00, 14:30)' })
  @Column()
  timeSlot: string;

  @ApiProperty({ description: 'Training type', enum: TrainingType })
  @Column({
    type: 'varchar',
  })
  trainingType: TrainingType;

  @ApiProperty({ description: 'Training location (state) for onsite training' })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({ description: 'Training languages required', isArray: true })
  @Column('simple-array')
  languages: string[];

  @ApiProperty({ description: 'Slot status', enum: SlotStatus })
  @Column({
    type: 'varchar',
    default: SlotStatus.BOOKED,
  })
  status: SlotStatus;

  // Relationships
  @ApiProperty({ description: 'Assigned trainer', type: () => Trainer })
  @ManyToOne(() => Trainer, { nullable: false })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Column()
  trainerId: string;

  @ApiProperty({ description: 'Associated onboarding record', type: () => Onboarding })
  @ManyToOne(() => Onboarding, { nullable: false })
  @JoinColumn({ name: 'onboardingId' })
  onboarding: Onboarding;

  @Column()
  onboardingId: string;

  @ApiProperty({ description: 'Created timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Completed timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ description: 'Cancelled timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;
} 