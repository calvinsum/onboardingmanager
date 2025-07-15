import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding, OnboardingStatus } from './entities/onboarding.entity';
import { TermsConditions } from './entities/terms-conditions.entity';
import { ProductSetupAttachment } from './entities/product-setup-attachment.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { AcknowledgeTermsDto } from './dto/acknowledge-terms.dto';
import { CloudinaryService } from '../common/services/cloudinary.service';
import * as crypto from 'crypto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Onboarding)
    private onboardingRepository: Repository<Onboarding>,
    @InjectRepository(TermsConditions)
    private termsConditionsRepository: Repository<TermsConditions>,
    @InjectRepository(ProductSetupAttachment)
    private attachmentRepository: Repository<ProductSetupAttachment>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(OnboardingManager)
    private onboardingManagerRepository: Repository<OnboardingManager>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createOnboarding(createOnboardingDto: CreateOnboardingDto, managerId: string): Promise<Onboarding> {
    const manager = await this.onboardingManagerRepository.findOne({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Onboarding manager not found');
    }

    const accessToken = this.generateAccessToken();
    const tokenExpiryDate = new Date();
    tokenExpiryDate.setDate(tokenExpiryDate.getDate() + 30);

    const onboarding = this.onboardingRepository.create({
      ...createOnboardingDto,
      expectedGoLiveDate: new Date(createOnboardingDto.expectedGoLiveDate),
      accessToken,
      tokenExpiryDate,
      createdByManager: manager,
      status: OnboardingStatus.CREATED,
    });
    
    return await this.onboardingRepository.save(onboarding);
  }

  async findAll(managerId: string): Promise<Onboarding[]> {
    return await this.onboardingRepository.find({
      where: { createdByManagerId: managerId },
      relations: ['productSetupAttachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, managerId: string): Promise<Onboarding> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { id, createdByManagerId: managerId },
      relations: ['productSetupAttachments'],
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    return onboarding;
  }

  async findByToken(token: string): Promise<Onboarding> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { accessToken: token },
      relations: ['productSetupAttachments'],
    });

    if (!onboarding) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date() > onboarding.tokenExpiryDate) {
      throw new BadRequestException('Access token has expired');
    }

    return onboarding;
  }

  async update(id: string, updateOnboardingDto: UpdateOnboardingDto, managerId: string): Promise<Onboarding> {
    const onboarding = await this.findOne(id, managerId);

    if (updateOnboardingDto.expectedGoLiveDate) {
      // Convert string to Date if needed
      updateOnboardingDto.expectedGoLiveDate = new Date(updateOnboardingDto.expectedGoLiveDate).toISOString();
    }

    Object.assign(onboarding, updateOnboardingDto);
    return await this.onboardingRepository.save(onboarding);
  }

  async updateByToken(token: string, updateOnboardingDto: UpdateOnboardingDto): Promise<Onboarding> {
    const onboarding = await this.findByToken(token);

    // Convert date strings to Date objects if needed
    if (updateOnboardingDto.expectedGoLiveDate) {
      updateOnboardingDto.expectedGoLiveDate = new Date(updateOnboardingDto.expectedGoLiveDate).toISOString();
    }
    if (updateOnboardingDto.deliveryConfirmedDate) {
      updateOnboardingDto.deliveryConfirmedDate = new Date(updateOnboardingDto.deliveryConfirmedDate).toISOString();
    }
    if (updateOnboardingDto.installationConfirmedDate) {
      updateOnboardingDto.installationConfirmedDate = new Date(updateOnboardingDto.installationConfirmedDate).toISOString();
    }
    if (updateOnboardingDto.trainingConfirmedDate) {
      updateOnboardingDto.trainingConfirmedDate = new Date(updateOnboardingDto.trainingConfirmedDate).toISOString();
    }
    if (updateOnboardingDto.productSetupConfirmedDate) {
      updateOnboardingDto.productSetupConfirmedDate = new Date(updateOnboardingDto.productSetupConfirmedDate).toISOString();
    }
    if (updateOnboardingDto.hardwareDeliveryDate) {
      updateOnboardingDto.hardwareDeliveryDate = new Date(updateOnboardingDto.hardwareDeliveryDate).toISOString();
    }
    if (updateOnboardingDto.hardwareInstallationDate) {
      updateOnboardingDto.hardwareInstallationDate = new Date(updateOnboardingDto.hardwareInstallationDate).toISOString();
    }
    if (updateOnboardingDto.trainingDate) {
      updateOnboardingDto.trainingDate = new Date(updateOnboardingDto.trainingDate).toISOString();
    }

    Object.assign(onboarding, updateOnboardingDto);
    return await this.onboardingRepository.save(onboarding);
  }

  async remove(id: string, managerId: string): Promise<void> {
    const onboarding = await this.findOne(id, managerId);
    await this.onboardingRepository.remove(onboarding);
  }

  async acknowledgeTerms(token: string, acknowledgeTermsDto: AcknowledgeTermsDto): Promise<Onboarding> {
    const onboarding = await this.findByToken(token);

    // Get the latest terms and conditions
    const latestTerms = await this.termsConditionsRepository.findOne({
      where: { isActive: true },
      order: { version: 'DESC' },
    });

    if (!latestTerms) {
      throw new NotFoundException('No active terms and conditions found');
    }

    // Update onboarding with acknowledgment
    onboarding.termsAccepted = true;
    onboarding.status = OnboardingStatus.IN_PROGRESS;

    return await this.onboardingRepository.save(onboarding);
  }

  async updateTrainingStatus(token: string, status: 'completed' | 'pending'): Promise<Onboarding> {
    const onboarding = await this.findByToken(token);

    onboarding.trainingConfirmed = status === 'completed';
    if (status === 'completed') {
      onboarding.trainingConfirmedDate = new Date();
      onboarding.status = OnboardingStatus.IN_PROGRESS;
    }

    return await this.onboardingRepository.save(onboarding);
  }

  async updateProductSetupStatus(token: string, status: 'completed' | 'pending'): Promise<Onboarding> {
    const onboarding = await this.findByToken(token);

    onboarding.productSetupConfirmed = status === 'completed';
    if (status === 'completed') {
      onboarding.productSetupConfirmedDate = new Date();
      onboarding.status = OnboardingStatus.IN_PROGRESS;
    }

    return await this.onboardingRepository.save(onboarding);
  }

  async uploadProductSetupAttachments(token: string, files: Express.Multer.File[]): Promise<Onboarding> {
    try {
      console.log('📁 Starting Cloudinary file upload for token:', token);
      console.log('📄 Number of files:', files.length);
      
      const onboarding = await this.onboardingRepository.findOne({
        where: { accessToken: token },
        relations: ['productSetupAttachments'],
      });

      if (!onboarding) {
        console.error('❌ Invalid token:', token);
        throw new NotFoundException('Invalid or expired token');
      }

      console.log('✅ Found onboarding record:', onboarding.id);

      // Check if token is expired
      if (new Date() > onboarding.tokenExpiryDate) {
        console.error('❌ Token expired:', onboarding.tokenExpiryDate);
        throw new BadRequestException('Access token has expired');
      }

      console.log('✅ Token is valid, uploading files to Cloudinary...');

      // Upload files to Cloudinary and create attachment records
      const attachments = [];
      
      for (const file of files) {
        console.log('📎 Processing file:', file.originalname, 'Size:', file.size);
        
        try {
          // Upload to Cloudinary
          const cloudinaryResult = await this.cloudinaryService.uploadFile(
            file, 
            `product-setup-attachments/${onboarding.id}`
          );
          
          console.log('☁️ Cloudinary upload successful:', cloudinaryResult.public_id);
          
          // Create attachment record
          const attachment = new ProductSetupAttachment();
          attachment.originalName = file.originalname;
          attachment.cloudinaryPublicId = cloudinaryResult.public_id;
          attachment.cloudinaryUrl = cloudinaryResult.secure_url;
          attachment.mimeType = file.mimetype;
          attachment.fileSize = file.size;
          attachment.onboardingId = onboarding.id;
          
          attachments.push(attachment);
        } catch (uploadError) {
          console.error('❌ Cloudinary upload failed for file:', file.originalname, uploadError);
          throw new BadRequestException(`Failed to upload file: ${file.originalname}`);
        }
      }

      // Save all attachments to database
      const savedAttachments = await this.attachmentRepository.save(attachments);
      console.log('💾 Saved', savedAttachments.length, 'attachments to database');

      // Update onboarding status
      onboarding.productSetupConfirmed = true;
      onboarding.productSetupConfirmedDate = new Date();
      onboarding.status = OnboardingStatus.COMPLETED;

      const updatedOnboarding = await this.onboardingRepository.save(onboarding);
      console.log('✅ Updated onboarding status to COMPLETED');

      // Return updated onboarding with attachments
      return await this.onboardingRepository.findOne({
        where: { id: onboarding.id },
        relations: ['productSetupAttachments'],
      });

    } catch (error) {
      console.error('❌ Error in uploadProductSetupAttachments:', error.message);
      console.error('❌ Stack trace:', error.stack);
      throw error;
    }
  }

  async getAttachmentsForDownload(onboardingId: string, managerId: string): Promise<ProductSetupAttachment[]> {
    // Verify the manager has access to this onboarding record
    const onboarding = await this.onboardingRepository.findOne({
      where: { 
        id: onboardingId,
        createdByManagerId: managerId 
      },
      relations: ['productSetupAttachments'],
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found or access denied');
    }

    return onboarding.productSetupAttachments;
  }

  private generateAccessToken(): string {
    // Generate a secure random token
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const combined = randomBytes.toString('hex') + timestamp;
    
    // Create a hash and take first 16 characters for readability
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16).toUpperCase();
  }
}
