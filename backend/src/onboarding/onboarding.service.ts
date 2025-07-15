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
          'SELECT "accessToken", id, "accountName" FROM onboarding WHERE LOWER("accessToken") = LOWER($1) OR TRIM("accessToken") = $1',
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
          console.log('🔗 Cloudinary URL:', cloudinaryResult.secure_url);
          
          // Validate required data before creating attachment
          if (!file.originalname || !cloudinaryResult.public_id || !cloudinaryResult.secure_url) {
            console.error('❌ Missing required file data:', {
              originalname: file.originalname,
              public_id: cloudinaryResult.public_id,
              secure_url: cloudinaryResult.secure_url
            });
            throw new BadRequestException('Missing required file data from Cloudinary');
          }
          
          // Create attachment record
          const attachment = new ProductSetupAttachment();
          attachment.originalName = file.originalname;
          attachment.cloudinaryPublicId = cloudinaryResult.public_id;
          attachment.cloudinaryUrl = cloudinaryResult.secure_url;
          attachment.mimeType = file.mimetype;
          attachment.fileSize = file.size;
          // Only set the foreign key, not the relationship to avoid conflicts
          attachment.onboardingId = onboarding.id;
          
          console.log('📝 Created attachment object:', {
            originalName: attachment.originalName,
            cloudinaryPublicId: attachment.cloudinaryPublicId,
            fileSize: attachment.fileSize,
            onboardingId: attachment.onboardingId,
            onboardingIdType: typeof attachment.onboardingId
          });
          
          attachments.push(attachment);
        } catch (uploadError) {
          console.error('❌ Cloudinary upload failed for file:', file.originalname, uploadError);
          throw new BadRequestException(`Failed to upload file: ${file.originalname}`);
        }
      }

      console.log('💾 Saving', attachments.length, 'attachments to database...');
      
      // Use a more direct approach with insert() to bypass entity management issues
      const savedAttachments = [];
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        try {
          console.log(`💾 Inserting attachment ${i + 1}/${attachments.length}:`, {
            originalName: attachment.originalName,
            onboardingId: attachment.onboardingId,
            onboardingIdType: typeof attachment.onboardingId
          });
          
          // Prepare the insert data
          const insertData = {
            originalName: attachment.originalName,
            cloudinaryPublicId: attachment.cloudinaryPublicId,
            cloudinaryUrl: attachment.cloudinaryUrl,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
            onboardingId: onboarding.id,  // Direct reference to the UUID
            uploadedAt: new Date()
          };
          
          console.log('🔍 Insert data:', insertData);
          console.log('🔍 onboarding.id details:', {
            value: onboarding.id,
            type: typeof onboarding.id,
            length: onboarding.id?.length,
            isNull: onboarding.id === null,
            isUndefined: onboarding.id === undefined
          });
          
          // Test foreign key relationship before insert
          console.log('🔍 Testing foreign key relationship...');
          try {
            const fkTest = await this.onboardingRepository.query(
              'SELECT id, "accountName" FROM onboarding WHERE id = $1',
              [onboarding.id]
            );
            console.log('🔍 Foreign key test result:', fkTest);
            
            if (fkTest.length === 0) {
              console.error('❌ Foreign key test failed: onboarding ID not found in database!');
              throw new BadRequestException('Onboarding record not found in database for foreign key');
            }
          } catch (fkError) {
            console.error('❌ Foreign key test error:', fkError);
            throw new BadRequestException(`Foreign key validation failed: ${fkError.message}`);
          }
          
          // Test the product_setup_attachments table structure
          console.log('🔍 Checking table schema...');
          try {
            const schemaCheck = await this.attachmentRepository.query(
              `SELECT column_name, data_type, is_nullable, column_default 
               FROM information_schema.columns 
               WHERE table_name = 'product_setup_attachments' AND column_name = 'onboardingId'`
            );
            console.log('🔍 onboardingId column schema:', schemaCheck);
          } catch (schemaError) {
            console.error('❌ Schema check error:', schemaError);
          }
          
          // Use insert() with plain object to avoid entity management issues
          // Add retry logic for transient database issues
          let insertResult;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              // First, try a direct SQL insert to bypass TypeORM entirely
              if (retryCount === 0) {
                console.log('🔍 Attempting direct SQL insert for debugging...');
                const directInsert = await this.attachmentRepository.query(`
                  INSERT INTO product_setup_attachments 
                  (id, "originalName", "cloudinaryPublicId", "cloudinaryUrl", "mimeType", "fileSize", "onboardingId", "uploadedAt")
                  VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
                  RETURNING id, "onboardingId"
                `, [
                  insertData.originalName,
                  insertData.cloudinaryPublicId,
                  insertData.cloudinaryUrl,
                  insertData.mimeType,
                  insertData.fileSize,
                  insertData.onboardingId,
                  insertData.uploadedAt
                ]);
                console.log('✅ Direct SQL insert successful:', directInsert);
                insertResult = { identifiers: [{ id: directInsert[0].id }] };
                break;
              }
              
              insertResult = await this.attachmentRepository.insert(insertData);
              break; // Success, exit retry loop
            } catch (retryError) {
              retryCount++;
              console.warn(`⚠️ Insert attempt ${retryCount} failed:`, retryError.message);
              
              if (retryCount >= maxRetries) {
                // Final fallback: try using the entity save method
                console.warn('🔄 Falling back to entity save method...');
                try {
                  const fallbackAttachment = new ProductSetupAttachment();
                  Object.assign(fallbackAttachment, insertData);
                  const savedAttachment = await this.attachmentRepository.save(fallbackAttachment);
                  insertResult = { identifiers: [{ id: savedAttachment.id }] };
                  console.log('✅ Fallback save successful');
                  break;
                } catch (fallbackError) {
                  console.error('❌ Fallback save also failed:', fallbackError.message);
                  throw retryError; // Re-throw the original error
                }
              }
              
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            }
          }
          
          console.log(`✅ Inserted attachment ${i + 1}:`, insertResult.identifiers[0]);
          
          // Fetch the saved attachment for the response
          const savedAttachment = await this.attachmentRepository.findOne({
            where: { id: insertResult.identifiers[0].id }
          });
          
          if (savedAttachment) {
            savedAttachments.push(savedAttachment);
          }
          
        } catch (dbError) {
          console.error(`❌ Database insert failed for attachment ${i + 1}:`, attachment.originalName, dbError);
          console.error('❌ Full error details:', {
            message: dbError.message,
            code: dbError.code,
            detail: dbError.detail,
            query: dbError.query,
            parameters: dbError.parameters,
            stack: dbError.stack
          });
          console.error('❌ Attachment data:', {
            originalName: attachment.originalName,
            onboardingId: onboarding.id,
            onboardingExists: !!onboarding,
            onboardingEntityId: onboarding?.id
          });
          throw new BadRequestException(`Database insert failed for ${attachment.originalName}: ${dbError.message}`);
        }
      }
      
      console.log('💾 All attachments inserted successfully:', savedAttachments.length);
      
      console.log('💾 Saved', savedAttachments.length, 'attachments to database');

      console.log('📝 Updating onboarding status...');
      
      // Update onboarding status
      onboarding.productSetupConfirmed = true;
      onboarding.productSetupConfirmedDate = new Date();
      onboarding.status = OnboardingStatus.COMPLETED;

      const updatedOnboarding = await this.onboardingRepository.save(onboarding);
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

  private generateAccessToken(): string {
    // Generate a secure random token
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const combined = randomBytes.toString('hex') + timestamp;
    
    // Create a hash and take first 16 characters for readability
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16).toUpperCase();
  }
}
