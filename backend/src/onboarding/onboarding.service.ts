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

    // Verify the terms version matches what was sent
    if (acknowledgeTermsDto.termsVersionId !== latestTerms.id) {
      throw new BadRequestException('Terms version mismatch. Please reload the page and try again.');
    }

    // Update onboarding with complete acknowledgment details
    onboarding.termsAccepted = true;
    onboarding.termsAcknowledgmentName = acknowledgeTermsDto.name;
    onboarding.termsAcknowledgedDate = new Date();
    onboarding.acknowledgedTermsVersion = latestTerms;
    onboarding.acknowledgedTermsVersionId = latestTerms.id;
    onboarding.status = OnboardingStatus.IN_PROGRESS;

    console.log('✅ Terms acknowledged by:', acknowledgeTermsDto.name);
    console.log('✅ Terms version:', latestTerms.version);
    console.log('✅ Acknowledgment date:', onboarding.termsAcknowledgedDate);

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

  async uploadProductSetupAttachments(token: string, files: Express.Multer.File[]): Promise<any> {
    try {
      console.log('📁 Starting Cloudinary file upload for token:', token);
      console.log('📄 Number of files:', files.length);
      console.log('📊 Files details:', files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })));
      
      // Add comprehensive debugging for the onboarding lookup
      console.log('🔍 Looking up onboarding record with token:', token);
      
      const onboarding = await this.onboardingRepository.findOne({
        where: { accessToken: token },
        relations: ['productSetupAttachments'],
      });

      if (!onboarding) {
        console.error('❌ Invalid token:', token);
        
        // Additional debugging: check if token exists with different casing or whitespace
        const tokenVariants = await this.onboardingRepository.query(
          'SELECT "accessToken", id, "accountName" FROM onboardings WHERE LOWER("accessToken") = LOWER($1) OR TRIM("accessToken") = $1',
          [token]
        );
        console.log('🔍 Token variants found:', tokenVariants);
        
        throw new NotFoundException('Invalid or expired token');
      }

      console.log('✅ Found onboarding record:', onboarding.id);
      console.log('📋 Existing attachments:', onboarding.productSetupAttachments?.length || 0);
      
      // Verify the onboarding record integrity
      console.log('🔍 Onboarding record verification:', {
        id: onboarding.id,
        accountName: onboarding.accountName,
        accessToken: onboarding.accessToken,
        tokenMatch: onboarding.accessToken === token,
        createdAt: onboarding.createdAt,
        status: onboarding.status
      });

      // Validate onboarding ID
      if (!onboarding.id) {
        console.error('❌ Onboarding ID is null or undefined');
        throw new BadRequestException('Invalid onboarding record - missing ID');
      }

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
          console.log('☁️ Uploading to Cloudinary...');
          const cloudinaryResult = await this.cloudinaryService.uploadFile(
            file, 
            `product-setup-attachments/${onboarding.id}`
          );
          
          console.log('☁️ Cloudinary upload successful:', cloudinaryResult.public_id);
          console.log('🔗 Original Cloudinary URL:', cloudinaryResult.secure_url);
          
          // Generate a public URL
          const publicUrl = this.cloudinaryService.getPublicFileUrl(cloudinaryResult.public_id);
          console.log('🌐 Generated public URL:', publicUrl);
          
          // Validate required data before creating attachment
          if (!file.originalname || !cloudinaryResult.public_id || !publicUrl) {
            console.error('❌ Missing required file data:', {
              originalname: file.originalname,
              public_id: cloudinaryResult.public_id,
              public_url: publicUrl
            });
            throw new BadRequestException('Missing required file data from Cloudinary');
          }
          
          // Create attachment record
          const attachment = new ProductSetupAttachment();
          attachment.originalName = file.originalname;
          attachment.cloudinaryPublicId = cloudinaryResult.public_id;
          attachment.cloudinaryUrl = publicUrl; // Use the generated public URL
          attachment.mimeType = file.mimetype;
          attachment.fileSize = file.size;
          // We'll set the onboardingId during SQL insert using freshOnboarding.id
          // attachment.onboardingId will be set later
          
          console.log('📝 Created attachment object:', {
            originalName: attachment.originalName,
            cloudinaryPublicId: attachment.cloudinaryPublicId,
            fileSize: attachment.fileSize,
            readyForInsert: true
          });
          
          attachments.push(attachment);
        } catch (uploadError) {
          console.error('❌ Cloudinary upload failed for file:', file.originalname, uploadError);
          throw new BadRequestException(`Failed to upload file: ${file.originalname}`);
        }
      }

      console.log('💾 Saving', attachments.length, 'attachments to database...');
      
      // Re-verify onboarding record exists and is valid before proceeding
      console.log('🔍 Re-verifying onboarding record before database operations...');
      const freshOnboarding = await this.onboardingRepository.findOne({
        where: { id: onboarding.id },
      });
      
      if (!freshOnboarding || !freshOnboarding.id) {
        console.error('❌ Fresh onboarding lookup failed:', {
          originalId: onboarding.id,
          freshLookupResult: freshOnboarding
        });
        throw new BadRequestException('Onboarding record became invalid during upload process');
      }
      
      console.log('✅ Fresh onboarding verification passed:', {
        id: freshOnboarding.id,
        accountName: freshOnboarding.accountName,
        status: freshOnboarding.status
      });
      
      // Use a more direct approach with insert() to bypass entity management issues
      const savedAttachments = [];
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        try {
          console.log(`💾 Inserting attachment ${i + 1}/${attachments.length}:`, {
            originalName: attachment.originalName,
            onboardingId: freshOnboarding.id,
            onboardingIdType: typeof freshOnboarding.id
          });
          
          // Use only direct SQL to completely bypass TypeORM entity management
          console.log('🔍 Using direct SQL insert with fresh onboarding ID...');
          try {
            const directInsert = await this.attachmentRepository.query(`
              INSERT INTO product_setup_attachments 
              (id, "originalName", "cloudinaryPublicId", "cloudinaryUrl", "mimeType", "fileSize", "onboardingId", "uploadedAt")
              VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::uuid, $7)
              RETURNING id, "onboardingId"
            `, [
              attachment.originalName,
              attachment.cloudinaryPublicId,
              attachment.cloudinaryUrl,
              attachment.mimeType,
              attachment.fileSize,
              freshOnboarding.id,  // Use fresh onboarding ID
              new Date()
            ]);
            console.log('✅ Direct SQL insert successful:', directInsert);
            
            // Fetch the saved attachment for the response
            const savedAttachment = await this.attachmentRepository.findOne({
              where: { id: directInsert[0].id }
            });
            
            if (savedAttachment) {
              savedAttachments.push(savedAttachment);
            }
            
            console.log(`✅ Inserted attachment ${i + 1}:`, directInsert[0].id);
            
          } catch (sqlError) {
            console.error('❌ Direct SQL insert failed:', sqlError);
            console.error('❌ SQL Error details:', {
              message: sqlError.message,
              code: sqlError.code,
              detail: sqlError.detail,
              constraint: sqlError.constraint,
              table: sqlError.table,
              column: sqlError.column
            });
            console.error('❌ Insert parameters:', {
              originalName: attachment.originalName,
              cloudinaryPublicId: attachment.cloudinaryPublicId,
              onboardingId: freshOnboarding.id,
              onboardingIdType: typeof freshOnboarding.id,
              onboardingIdLength: freshOnboarding.id?.length
            });
            throw new BadRequestException(`Direct SQL insert failed for ${attachment.originalName}: ${sqlError.message}`);
          }
          
        } catch (dbError) {
          console.error(`❌ Database insert failed for attachment ${i + 1}:`, attachment.originalName, dbError);
          throw new BadRequestException(`Database insert failed for ${attachment.originalName}: ${dbError.message}`);
        }
      }
      
      console.log('💾 All attachments inserted successfully:', savedAttachments.length);
      
      console.log('💾 Saved', savedAttachments.length, 'attachments to database');

      console.log('📝 Updating onboarding status...');
      
      // Update onboarding status using fresh onboarding record
      freshOnboarding.productSetupConfirmed = true;
      freshOnboarding.productSetupConfirmedDate = new Date();
      freshOnboarding.status = OnboardingStatus.COMPLETED;

      const updatedOnboarding = await this.onboardingRepository.save(freshOnboarding);
      console.log('✅ Updated onboarding status to COMPLETED');

      console.log('📋 Preparing response...');
      
      // Return a clean response without circular references
      const responseData = {
        id: updatedOnboarding.id,
        accountName: updatedOnboarding.accountName,
        productSetupConfirmed: updatedOnboarding.productSetupConfirmed,
        productSetupConfirmedDate: updatedOnboarding.productSetupConfirmedDate,
        status: updatedOnboarding.status,
        attachmentCount: savedAttachments.length,
        attachments: savedAttachments.map(attachment => ({
          id: attachment.id,
          originalName: attachment.originalName,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          cloudinaryUrl: attachment.cloudinaryUrl,
          uploadedAt: attachment.uploadedAt || new Date(),
          createdAt: attachment.uploadedAt || new Date(),
        }))
      };
      
      console.log('📋 Returning clean response with', responseData.attachments.length, 'attachments');
      console.log('✅ Upload process completed successfully');
      
      return responseData;

    } catch (error) {
      console.error('❌ Error in uploadProductSetupAttachments:', error.message);
      console.error('❌ Stack trace:', error.stack);
      
      // If it's a known error, rethrow it
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      // For unknown errors, provide a more specific error message
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async getAttachmentsForDownload(onboardingId: string, managerId: string): Promise<ProductSetupAttachment[]> {
    console.log('🔍 Getting attachments for onboarding:', onboardingId, 'Manager:', managerId);
    
    // Verify the manager has access to this onboarding record
    const onboarding = await this.onboardingRepository.findOne({
      where: { 
        id: onboardingId,
        createdByManagerId: managerId 
      },
      relations: ['productSetupAttachments'],
    });

    if (!onboarding) {
      console.error('❌ Onboarding record not found or access denied');
      throw new NotFoundException('Onboarding record not found or access denied');
    }

    console.log('✅ Found onboarding record with attachments:', onboarding.productSetupAttachments.length);
    onboarding.productSetupAttachments.forEach((attachment, index) => {
      console.log(`📎 Attachment ${index + 1}:`, {
        id: attachment.id,
        originalName: attachment.originalName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        cloudinaryUrl: attachment.cloudinaryUrl,
        cloudinaryPublicId: attachment.cloudinaryPublicId,
      });
    });

    return onboarding.productSetupAttachments;
  }

  async downloadAttachmentProxy(attachmentId: string, managerId: string, res: any): Promise<void> {
    console.log('📥 Proxying attachment download:', attachmentId, 'for manager:', managerId);
    
    // Find the attachment and verify access
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['onboarding'],
    });

    if (!attachment) {
      console.error('❌ Attachment not found:', attachmentId);
      throw new NotFoundException('Attachment not found');
    }

    // Verify the manager has access to this attachment's onboarding record
    if (attachment.onboarding.createdByManagerId !== managerId) {
      console.error('❌ Access denied for manager:', managerId, 'to attachment:', attachmentId);
      throw new NotFoundException('Access denied');
    }

    console.log('✅ Access verified for attachment:', attachment.originalName);

    try {
      // Use the stored cloudinaryUrl directly or generate a fresh public URL
      let fileUrl = attachment.cloudinaryUrl;
      
      // If no stored URL, generate a public URL from the public ID
      if (!fileUrl || fileUrl.includes('401')) {
        console.log('🔄 Generating fresh public URL...');
        fileUrl = this.cloudinaryService.getPublicFileUrl(attachment.cloudinaryPublicId);
      }

      console.log('🔗 Using Cloudinary URL:', fileUrl);

      // Set proper headers for file download
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');

      // Simply fetch the public file without any authentication
      const https = require('https');
      const url = require('url');
      
      const parsedUrl = url.parse(fileUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : require('http');
      
      const request = protocol.get(fileUrl, (fileResponse) => {
        console.log('📊 Cloudinary response status:', fileResponse.statusCode);
        console.log('📊 Cloudinary response headers:', fileResponse.headers);
        
        if (fileResponse.statusCode === 200) {
          console.log('✅ Successfully streaming file from Cloudinary');
          fileResponse.pipe(res);
        } else if (fileResponse.statusCode === 301 || fileResponse.statusCode === 302) {
          // Handle redirects
          const redirectUrl = fileResponse.headers.location;
          console.log('🔄 Following redirect to:', redirectUrl);
          
          protocol.get(redirectUrl, (redirectResponse) => {
            if (redirectResponse.statusCode === 200) {
              console.log('✅ Successfully streaming after redirect');
              redirectResponse.pipe(res);
            } else {
              console.error('❌ Redirect failed:', redirectResponse.statusCode);
              res.status(500).json({ error: `Cloudinary redirect failed: ${redirectResponse.statusCode}` });
            }
          }).on('error', (error) => {
            console.error('❌ Redirect request error:', error);
            res.status(500).json({ error: 'Failed to follow redirect' });
          });
        } else {
          console.error('❌ Failed to fetch file from Cloudinary:', fileResponse.statusCode);
          console.error('❌ Response:', fileResponse.statusMessage);
          res.status(500).json({ error: `Cloudinary returned ${fileResponse.statusCode}: ${fileResponse.statusMessage}` });
        }
      });

      request.on('error', (error) => {
        console.error('❌ Error fetching file from Cloudinary:', error);
        res.status(500).json({ error: 'Failed to fetch file from Cloudinary' });
      });

    } catch (error) {
      console.error('❌ Error in downloadAttachmentProxy:', error);
      res.status(500).json({ error: 'Failed to download attachment' });
    }
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
