import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { OnboardingManager } from '../../onboarding-manager/entities/onboarding-manager.entity';

export enum OnboardingType {
  HARDWARE_DELIVERY = 'hardware_delivery',
  HARDWARE_INSTALLATION = 'hardware_installation',
  REMOTE_TRAINING = 'remote_training',
  ONSITE_TRAINING = 'onsite_training',
}

export enum OnboardingStatus {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('onboardings')
@Index(['accessToken'], { unique: true })
export class Onboarding {
  @ApiProperty({ description: 'Onboarding ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Onboarding types', enum: OnboardingType, isArray: true })
  @Column('simple-array')
  onboardingTypes: OnboardingType[];

  // Delivery Address
  @ApiProperty({ description: 'Delivery address line 1' })
  @Column()
  deliveryAddress1: string;

  @ApiProperty({ description: 'Delivery address line 2' })
  @Column({ nullable: true })
  deliveryAddress2: string;

  @ApiProperty({ description: 'Delivery city' })
  @Column()
  deliveryCity: string;

  @ApiProperty({ description: 'Delivery state' })
  @Column()
  deliveryState: string;

  @ApiProperty({ description: 'Delivery postal code' })
  @Column()
  deliveryPostalCode: string;

  @ApiProperty({ description: 'Delivery country' })
  @Column({ default: 'Malaysia' })
  deliveryCountry: string;

  // Training Address
  @ApiProperty({ description: 'Use same address for training' })
  @Column({ default: false })
  useSameAddressForTraining: boolean;

  @ApiProperty({ description: 'Training address line 1' })
  @Column({ nullable: true })
  trainingAddress1: string;

  @ApiProperty({ description: 'Training address line 2' })
  @Column({ nullable: true })
  trainingAddress2: string;

  @ApiProperty({ description: 'Training city' })
  @Column({ nullable: true })
  trainingCity: string;

  @ApiProperty({ description: 'Training state' })
  @Column({ nullable: true })
  trainingState: string;

  @ApiProperty({ description: 'Training postal code' })
  @Column({ nullable: true })
  trainingPostalCode: string;

  @ApiProperty({ description: 'Training country' })
  @Column({ nullable: true })
  trainingCountry: string;

  // PIC Details
  @ApiProperty({ description: 'Person in charge name' })
  @Column()
  picName: string;

  @ApiProperty({ description: 'Person in charge phone' })
  @Column()
  picPhone: string;

  @ApiProperty({ description: 'Person in charge email' })
  @Column()
  picEmail: string;

  // Expected Go Live Date
  @ApiProperty({ description: 'Expected go live date' })
  @Column({ type: 'date' })
  expectedGoLiveDate: Date;

  // Token Management
  @ApiProperty({ description: 'Access token for merchant' })
  @Column({ unique: true })
  accessToken: string;

  @ApiProperty({ description: 'Token expiry date' })
  @Column({ type: 'timestamp' })
  tokenExpiryDate: Date;

  @ApiProperty({ description: 'Onboarding status', enum: OnboardingStatus })
  @Column({
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.CREATED,
  })
  status: OnboardingStatus;

  // Relationships
  @ApiProperty({ description: 'Associated merchant' })
  @ManyToOne(() => Merchant, { nullable: true, eager: false })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Merchant;

  @Column({ nullable: true })
  merchantId?: string;

  @ApiProperty({ description: 'Created by onboarding manager' })
  @ManyToOne(() => OnboardingManager, { eager: false })
  @JoinColumn({ name: 'createdByManagerId' })
  createdByManager: OnboardingManager;

  @Column()
  createdByManagerId: string;

  @ApiProperty({ description: 'Created timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
} 