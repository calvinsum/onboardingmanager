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
    
    if (createOnboardingDto.useSameAddressForTraining) {
      onboarding.trainingAddress1 = createOnboardingDto.deliveryAddress1;
      onboarding.trainingAddress2 = createOnboardingDto.deliveryAddress2;
      onboarding.trainingCity = createOnboardingDto.deliveryCity;
      onboarding.trainingState = createOnboardingDto.deliveryState;
      onboarding.trainingPostalCode = createOnboardingDto.deliveryPostalCode;
      onboarding.trainingCountry = createOnboardingDto.deliveryCountry;
    }

    return this.onboardingRepository.save(onboarding);
  }

  async updateOnboarding(id: string, updateOnboardingDto: UpdateOnboardingDto): Promise<Onboarding> {
    const onboarding = await this.getOnboardingById(id);

    // Separate date fields from the rest of the DTO to handle type conversion
    const { 
      expectedGoLiveDate, 
      hardwareDeliveryDate, 
      hardwareInstallationDate, 
      trainingDate,
      deliveryConfirmedDate,
      installationConfirmedDate,
      trainingConfirmedDate,
      productSetupConfirmedDate,
      ...restOfDto 
    } = updateOnboardingDto;
    
    const updatePayload: Partial<Onboarding> = { ...restOfDto };

    // Handle date conversions
    if (expectedGoLiveDate) {
      updatePayload.expectedGoLiveDate = new Date(expectedGoLiveDate);
    }

    if (hardwareDeliveryDate) {
      updatePayload.hardwareDeliveryDate = new Date(hardwareDeliveryDate);
    }

    if (hardwareInstallationDate) {
      updatePayload.hardwareInstallationDate = new Date(hardwareInstallationDate);
    }

    if (trainingDate) {
      updatePayload.trainingDate = new Date(trainingDate);
    }

    if (deliveryConfirmedDate) {
      updatePayload.deliveryConfirmedDate = new Date(deliveryConfirmedDate);
    }

    if (installationConfirmedDate) {
      updatePayload.installationConfirmedDate = new Date(installationConfirmedDate);
    }

    if (trainingConfirmedDate) {
      updatePayload.trainingConfirmedDate = new Date(trainingConfirmedDate);
    }

    if (productSetupConfirmedDate) {
      updatePayload.productSetupConfirmedDate = new Date(productSetupConfirmedDate);
    }
    // Auto-set delivery confirmation date if delivery is being confirmed and no date provided
    if (updateOnboardingDto.deliveryConfirmed && !onboarding.deliveryConfirmed && !deliveryConfirmedDate) {
      updatePayload.deliveryConfirmedDate = new Date();
    }

    // Auto-set installation confirmation date if installation is being confirmed and no date provided
    if (updateOnboardingDto.installationConfirmed && !onboarding.installationConfirmed && !installationConfirmedDate) {
      updatePayload.installationConfirmedDate = new Date();
    }

    // Auto-set training confirmation date if training is being confirmed and no date provided
    if (updateOnboardingDto.trainingConfirmed && !onboarding.trainingConfirmed && !trainingConfirmedDate) {
      updatePayload.trainingConfirmedDate = new Date();
    }

    // Auto-set product setup confirmation date if product setup is being confirmed and no date provided
    if (updateOnboardingDto.productSetupConfirmed && !onboarding.productSetupConfirmed && !productSetupConfirmedDate) {
      updatePayload.productSetupConfirmedDate = new Date();
    }    
    // `merge` will update the `onboarding` entity with the new values
    const updatedOnboarding = this.onboardingRepository.merge(onboarding, updatePayload);

    return this.onboardingRepository.save(updatedOnboarding);
  }

  async getAllOnboardings(): Promise<Onboarding[]> {
    return this.onboardingRepository.find({
      relations: ['createdByManager', 'merchant'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOnboardingById(id: string): Promise<Onboarding> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { id },
      relations: ['createdByManager', 'merchant'],
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    return onboarding;
  }

  async getOnboardingByToken(token: string): Promise<Onboarding> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { accessToken: token },
      relations: ['createdByManager', 'merchant'],
    });

    if (!onboarding) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date() > onboarding.tokenExpiryDate) {
      // Regenerate token
      const newToken = this.generateAccessToken();
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);

      onboarding.accessToken = newToken;
      onboarding.tokenExpiryDate = newExpiryDate;
      
      await this.onboardingRepository.save(onboarding);
    }

    return onboarding;
  }

  async updateOnboardingByToken(token: string, updateOnboardingDto: UpdateOnboardingDto): Promise<Onboarding> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { accessToken: token },
      relations: ['createdByManager', 'merchant'],
    });

    if (!onboarding) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date() > onboarding.tokenExpiryDate) {
      throw new BadRequestException('Access token has expired');
    }

    // Separate date fields from the rest of the DTO to handle type conversion
    const { 
      expectedGoLiveDate, 
      hardwareDeliveryDate, 
      hardwareInstallationDate, 
      trainingDate,
      deliveryConfirmedDate,
      installationConfirmedDate,
      trainingConfirmedDate,
      productSetupConfirmedDate,
      ...restOfDto 
    } = updateOnboardingDto;
    
    const updatePayload: Partial<Onboarding> = { ...restOfDto };

    // Handle date conversions
    if (expectedGoLiveDate) {
      updatePayload.expectedGoLiveDate = new Date(expectedGoLiveDate);
    }

    if (hardwareDeliveryDate) {
      updatePayload.hardwareDeliveryDate = new Date(hardwareDeliveryDate);
    }

    if (hardwareInstallationDate) {
      updatePayload.hardwareInstallationDate = new Date(hardwareInstallationDate);
    }

    if (trainingDate) {
      updatePayload.trainingDate = new Date(trainingDate);
    }

    if (deliveryConfirmedDate) {
      updatePayload.deliveryConfirmedDate = new Date(deliveryConfirmedDate);
    }

    if (installationConfirmedDate) {
      updatePayload.installationConfirmedDate = new Date(installationConfirmedDate);
    }

    if (trainingConfirmedDate) {
      updatePayload.trainingConfirmedDate = new Date(trainingConfirmedDate);
    }


    if (productSetupConfirmedDate) {
      updatePayload.productSetupConfirmedDate = new Date(productSetupConfirmedDate);
    }    // Auto-set delivery confirmation date if delivery is being confirmed and no date provided
    if (updateOnboardingDto.deliveryConfirmed && !onboarding.deliveryConfirmed && !deliveryConfirmedDate) {
      updatePayload.deliveryConfirmedDate = new Date();
    }

    // Auto-set installation confirmation date if installation is being confirmed and no date provided
    if (updateOnboardingDto.installationConfirmed && !onboarding.installationConfirmed && !installationConfirmedDate) {
      updatePayload.installationConfirmedDate = new Date();
    }

    // Auto-set training confirmation date if training is being confirmed and no date provided
    if (updateOnboardingDto.trainingConfirmed && !onboarding.trainingConfirmed && !trainingConfirmedDate) {
      updatePayload.trainingConfirmedDate = new Date();
    }

    // Auto-set product setup confirmation date if product setup is being confirmed and no date provided
    if (updateOnboardingDto.productSetupConfirmed && !onboarding.productSetupConfirmed && !productSetupConfirmedDate) {
      updatePayload.productSetupConfirmedDate = new Date();
    }    
    // `merge` will update the `onboarding` entity with the new values
    const updatedOnboarding = this.onboardingRepository.merge(onboarding, updatePayload);

    return this.onboardingRepository.save(updatedOnboarding);
  }

  async updateOnboardingStatus(id: string, status: OnboardingStatus): Promise<Onboarding> {
    const onboarding = await this.getOnboardingById(id);
    
    onboarding.status = status;
    await this.onboardingRepository.save(onboarding);

    return this.getOnboardingById(id);
  }

  async linkMerchant(onboardingId: string, merchantId: string): Promise<Onboarding> {
    const onboarding = await this.getOnboardingById(onboardingId);
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId }
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    onboarding.merchantId = merchantId;
    await this.onboardingRepository.save(onboarding);

    return this.getOnboardingById(onboardingId);
  }

  async regenerateToken(id: string): Promise<Onboarding> {
    const onboarding = await this.getOnboardingById(id);
    
    // Generate new token
    const newToken = this.generateAccessToken();
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

    onboarding.accessToken = newToken;
    onboarding.tokenExpiryDate = newExpiryDate;
    
    await this.onboardingRepository.save(onboarding);

    return this.getOnboardingById(id);
  }

  async acknowledgeTermsByToken(token: string, acknowledgeTermsDto: AcknowledgeTermsDto): Promise<Onboarding> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { accessToken: token },
      relations: ['createdByManager', 'merchant', 'acknowledgedTermsVersion'],
    });

    if (!onboarding) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date() > onboarding.tokenExpiryDate) {
      throw new BadRequestException('Access token has expired');
    }

    // Verify the terms version exists
    const termsVersion = await this.termsConditionsRepository.findOne({
      where: { id: acknowledgeTermsDto.termsVersionId },
    });

    if (!termsVersion) {
      throw new NotFoundException('Terms and conditions version not found');
    }

    // Update onboarding record with acknowledgment
    onboarding.termsAccepted = true;
    onboarding.termsAcknowledgmentName = acknowledgeTermsDto.name;
    onboarding.termsAcknowledgedDate = new Date();
    onboarding.acknowledgedTermsVersion = termsVersion;
    onboarding.acknowledgedTermsVersionId = termsVersion.id;

    return this.onboardingRepository.save(onboarding);
  }

  async checkTermsAcknowledgmentByToken(token: string): Promise<{ acknowledged: boolean; currentTerms?: TermsConditions }> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { accessToken: token },
      relations: ['acknowledgedTermsVersion'],
    });

    if (!onboarding) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date() > onboarding.tokenExpiryDate) {
      throw new BadRequestException('Access token has expired');
    }

    // Get current active terms
    const currentTerms = await this.termsConditionsRepository.findOne({
      where: { isActive: true },
    });

    // Check if terms have been acknowledged and if it's the current version
    const acknowledged = onboarding.termsAccepted && 
                        onboarding.acknowledgedTermsVersion && 
                        currentTerms && 
                        onboarding.acknowledgedTermsVersion.id === currentTerms.id;

    return {
      acknowledged,
      currentTerms: currentTerms || undefined,
    };
  }

  async uploadProductSetupAttachments(token: string, files: Express.Multer.File[]): Promise<Onboarding> {
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

    // Create attachment records
    const attachments = files.map(file => {
      const attachment = new ProductSetupAttachment();
      attachment.originalName = file.originalname;
      attachment.storedName = file.filename;
      attachment.mimeType = file.mimetype;
      attachment.fileSize = file.size;
      attachment.filePath = file.path;
      attachment.onboardingId = onboarding.id;
      return attachment;
    });

    // Save attachments to database
    await this.attachmentRepository.save(attachments);

    // Update onboarding record to mark product setup as confirmed
    onboarding.productSetupConfirmed = true;
    onboarding.productSetupConfirmedDate = new Date();
    
    await this.onboardingRepository.save(onboarding);

    // Return updated onboarding with attachments
    return this.onboardingRepository.findOne({
      where: { id: onboarding.id },
      relations: ['productSetupAttachments', 'createdByManager', 'merchant'],
    });
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

  // Helper method to check if token is expired
  async isTokenExpired(token: string): Promise<boolean> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { accessToken: token }
    });

    if (!onboarding) {
      return true;
    }

    return new Date() > onboarding.tokenExpiryDate;
  }

  // Get onboardings created by a specific manager
  async getOnboardingsByManager(managerId: string): Promise<Onboarding[]> {
    return this.onboardingRepository.find({
      where: { createdByManagerId: managerId },
      relations: ['createdByManager', 'merchant'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyOnboardings(managerId: string): Promise<Onboarding[]> {
    return this.onboardingRepository.find({
      where: { createdByManagerId: managerId },
      relations: ['createdByManager', 'merchant', 'acknowledgedTermsVersion', 'productSetupAttachments'],
    });
  }

  // Debug method to test manager lookup
  async debugManagerLookup(managerId: string): Promise<{ found: boolean; manager?: any }> {
    try {
      const manager = await this.onboardingManagerRepository.findOne({
        where: { id: managerId }
      });
      
      return {
        found: !!manager,
        manager: manager ? { id: manager.id, email: manager.email } : null
      };
    } catch (error) {
      console.error('Error in debugManagerLookup:', error);
      return {
        found: false,
        manager: null
      };
    }
  }
} 