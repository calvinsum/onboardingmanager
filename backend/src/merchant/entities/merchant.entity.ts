import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Onboarding } from '../../onboarding/entities/onboarding.entity';

export enum MerchantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('merchants')
@Index(['email'], { unique: true })
export class Merchant {
  @ApiProperty({ description: 'Merchant ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Merchant email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Merchant password hash' })
  @Column()
  password: string;

  @ApiProperty({ description: 'Business name' })
  @Column({ nullable: true })
  businessName: string;

  @ApiProperty({ description: 'Business registration number' })
  @Column({ nullable: true })
  businessRegistrationNumber: string;

  @ApiProperty({ description: 'Contact person name' })
  @Column({ nullable: true })
  contactPersonName: string;

  @ApiProperty({ description: 'Contact phone number' })
  @Column({ nullable: true })
  contactPhone: string;

  @ApiProperty({ description: 'Business address' })
  @Column('text', { nullable: true })
  businessAddress: string;

  @ApiProperty({ description: 'Business category' })
  @Column({ nullable: true })
  businessCategory: string;

  @ApiProperty({ description: 'Merchant status', enum: MerchantStatus })
  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.PENDING,
  })
  status: MerchantStatus;

  @ApiProperty({ description: 'Is email verified' })
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Email verification token' })
  @Column({ nullable: true })
  emailVerificationToken: string;

  @ApiProperty({ description: 'Password reset token' })
  @Column({ nullable: true })
  passwordResetToken: string;

  @ApiProperty({ description: 'Password reset token expiry' })
  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date;

  @ApiProperty({ description: 'Last login timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @ApiProperty({ description: 'Created timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ type: () => [Onboarding] })
  @OneToMany(() => Onboarding, (onboarding) => onboarding.merchant)
  onboardingRecords: Onboarding[];
} 