import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Manager password hash' })
  @Column()
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

  @ApiProperty({ description: 'Created timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
} 