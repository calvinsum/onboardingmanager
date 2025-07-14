import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { OnboardingManager } from '../../onboarding-manager/entities/onboarding-manager.entity';
import { TermsConditions } from './terms-conditions.entity';
import { ProductSetupAttachment } from './product-setup-attachment.entity';
export enum OnboardingType {
  HARDWARE_DELIVERY = 'hardware_delivery',
  HARDWARE_INSTALLATION = 'hardware_installation',
  PRODUCT_SETUP = 'product_setup',
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

  @ApiProperty({ description: 'Account name' })
  @Column({ nullable: true })
  accountName: string;

  @ApiProperty({ description: 'Delivery confirmation status' })
  @Column({ default: false })
  deliveryConfirmed: boolean;

  @ApiProperty({ description: 'Date when delivery was confirmed' })
  @Column({ type: 'timestamp', nullable: true })
  deliveryConfirmedDate: Date;

  @ApiProperty({ description: 'Installation confirmation status' })
  @Column({ default: false })
  installationConfirmed: boolean;

  @ApiProperty({ description: 'Date when installation was confirmed' })
  @Column({ type: 'timestamp', nullable: true })
  installationConfirmedDate: Date;

  @ApiProperty({ description: 'Training confirmation status' })
  @Column({ default: false })
  trainingConfirmed: boolean;

  @ApiProperty({ description: 'Date when training was confirmed' })
  @Column({ type: 'timestamp', nullable: true })
  trainingConfirmedDate: Date;

  @ApiProperty({ description: 'Product setup confirmation status' })
  @Column({ default: false })
  productSetupConfirmed: boolean;

  @ApiProperty({ description: 'Date when product setup was confirmed' })
  @Column({ type: 'timestamp', nullable: true })
  productSetupConfirmedDate: Date;

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

  @ApiProperty({ description: 'Training preference languages', isArray: true })
  @Column('simple-array', { nullable: true })
  trainingPreferenceLanguages: string[];

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
  @ApiProperty({ description: 'Associated merchant', type: () => Merchant })
  @ManyToOne(() => Merchant, (merchant) => merchant.onboardingRecords, { nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Merchant;

  @Column({ nullable: true })
  merchantId?: string;

  @ApiProperty({ description: 'Created by onboarding manager', type: () => OnboardingManager })
  @ManyToOne(() => OnboardingManager, (manager) => manager.createdOnboardings)
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

  // Schedule Dates
  @ApiProperty({ description: 'Scheduled date for hardware delivery', nullable: true })
  @Column({ type: 'date', nullable: true })
  hardwareDeliveryDate: Date | null;

  @ApiProperty({ description: 'Scheduled date and time for hardware installation', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  hardwareInstallationDate: Date | null;

  @ApiProperty({ description: 'Scheduled date and time for training', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  trainingDate: Date | null;

  @ApiProperty({ description: 'Scheduled date for remote training', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  remoteTrainingDate: Date | null;

  @ApiProperty({ description: 'Scheduled date for onsite training', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  onsiteTrainingDate: Date | null;

  // Terms and Conditions Acknowledgment
  @ApiProperty({ description: 'Terms and Conditions acknowledgment status' })
  @Column({ default: false })
  termsAccepted: boolean;

  @ApiProperty({ description: 'Name provided during T&C acknowledgment' })
  @Column({ nullable: true })
  termsAcknowledgmentName: string;

  @ApiProperty({ description: 'Date when T&C was acknowledged' })
  @Column({ type: 'timestamp', nullable: true })
  termsAcknowledgedDate: Date;

  @ApiProperty({ description: 'Version of T&C that was acknowledged', type: () => TermsConditions })
  @ManyToOne(() => TermsConditions, { nullable: true })
  @JoinColumn({ name: 'acknowledgedTermsVersionId' })
  acknowledgedTermsVersion?: TermsConditions;

  @Column({ nullable: true })
  acknowledgedTermsVersionId?: string;

  @ApiProperty({ description: 'Product setup attachments', type: () => [ProductSetupAttachment] })
  @OneToMany(() => ProductSetupAttachment, (attachment) => attachment.onboarding)
  productSetupAttachments: ProductSetupAttachment[];} 