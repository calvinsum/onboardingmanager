import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('terms_conditions')
export class TermsConditions {
  @ApiProperty({ description: 'Terms and Conditions ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Version number' })
  @Column({ type: 'varchar', length: 20 })
  version: string;

  @ApiProperty({ description: 'Terms and Conditions content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Whether this version is currently active' })
  @Column({ default: false })
  isActive: boolean;

  @ApiProperty({ description: 'Effective date' })
  @Column({ type: 'timestamp' })
  effectiveDate: Date;

  @ApiProperty({ description: 'Created timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
} 