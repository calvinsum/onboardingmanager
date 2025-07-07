import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Onboarding } from '../../onboarding/entities/onboarding.entity';

export enum OnboardingManagerRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}

@Entity('onboarding_managers')
@Index(['email'], { unique: true })
export class OnboardingManager {
  @ApiProperty({ description: 'Onboarding Manager ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Manager email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Manager password hash (optional for Google OAuth)' })
  @Column({ nullable: true })
  password: string;

  @ApiProperty({ description: 'Manager full name' })
  @Column()
  fullName: string;

  @ApiProperty({ description: 'Manager role', enum: OnboardingManagerRole })
  @Column({
    type: 'enum',
    enum: OnboardingManagerRole,
    default: OnboardingManagerRole.MANAGER,
  })
  role: OnboardingManagerRole;

  @ApiProperty({ description: 'Is account active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @ApiProperty({ description: 'OAuth provider (google, null for password)' })
  @Column({ nullable: true })
  oauthProvider: string;

  @ApiProperty({ description: 'Created timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Onboarding, (onboarding) => onboarding.createdByManager)
  createdOnboardings: Onboarding[];
}
