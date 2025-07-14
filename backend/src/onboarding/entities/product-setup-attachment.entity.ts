import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Onboarding } from './onboarding.entity';

@Entity('product_setup_attachments')
export class ProductSetupAttachment {
  @ApiProperty({ description: 'Attachment ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Original filename' })
  @Column()
  originalName: string;

  @ApiProperty({ description: 'Stored filename' })
  @Column()
  storedName: string;

  @ApiProperty({ description: 'File MIME type' })
  @Column()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column()
  fileSize: number;

  @ApiProperty({ description: 'File path on server' })
  @Column()
  filePath: string;

  @ApiProperty({ description: 'Upload timestamp' })
  @CreateDateColumn()
  uploadedAt: Date;

  // Relationship
  @ApiProperty({ description: 'Associated onboarding record', type: () => Onboarding })
  @ManyToOne(() => Onboarding, (onboarding) => onboarding.productSetupAttachments)
  @JoinColumn({ name: 'onboardingId' })
  onboarding: Onboarding;

  @Column()
  onboardingId: string;
} 