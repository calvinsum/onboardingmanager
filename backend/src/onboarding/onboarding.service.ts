import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding, OnboardingStatus } from './entities/onboarding.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import * as crypto from 'crypto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Onboarding)
    private onboardingRepository: Repository<Onboarding>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(OnboardingManager)
    private onboardingManagerRepository: Repository<OnboardingManager>,
  ) {}

  async createOnboarding(createOnboardingDto: CreateOnboardingDto, managerId: string): Promise<Onboarding> {
    try {
      console.log('Creating onboarding with managerId:', managerId);
      console.log('DTO:', JSON.stringify(createOnboardingDto, null, 2));
      
      // Verify manager exists
      const manager = await this.onboardingManagerRepository.findOne({
        where: { id: managerId }
      });

      console.log('Found manager:', manager ? 'Yes' : 'No');
      if (!manager) {
        throw new NotFoundException(`Onboarding manager not found with ID: ${managerId}`);
      }

      // Generate unique access token
      const accessToken = this.generateAccessToken();
      
      // Set token expiry to 30 days from now
      const tokenExpiryDate = new Date();
      tokenExpiryDate.setDate(tokenExpiryDate.getDate() + 30);

      // Parse the date safely
      let expectedGoLiveDate: Date;
      try {
        expectedGoLiveDate = new Date(createOnboardingDto.expectedGoLiveDate);
        if (isNaN(expectedGoLiveDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        throw new BadRequestException(`Invalid expected go live date: ${createOnboardingDto.expectedGoLiveDate}`);
      }

      // Create basic onboarding object first
      const onboardingData = {
        onboardingTypes: createOnboardingDto.onboardingTypes,
        deliveryAddress1: createOnboardingDto.deliveryAddress1,
        deliveryAddress2: createOnboardingDto.deliveryAddress2 || null,
        deliveryCity: createOnboardingDto.deliveryCity,
        deliveryState: createOnboardingDto.deliveryState,
        deliveryPostalCode: createOnboardingDto.deliveryPostalCode,
        deliveryCountry: createOnboardingDto.deliveryCountry,
        useSameAddressForTraining: createOnboardingDto.useSameAddressForTraining,
        picName: createOnboardingDto.picName,
        picPhone: createOnboardingDto.picPhone,
        picEmail: createOnboardingDto.picEmail,
        expectedGoLiveDate,
        accessToken,
        tokenExpiryDate,
        createdByManagerId: managerId,
        status: OnboardingStatus.CREATED,
      };

      // Handle training address
      if (createOnboardingDto.useSameAddressForTraining) {
        onboardingData['trainingAddress1'] = createOnboardingDto.deliveryAddress1;
        onboardingData['trainingAddress2'] = createOnboardingDto.deliveryAddress2 || null;
        onboardingData['trainingCity'] = createOnboardingDto.deliveryCity;
        onboardingData['trainingState'] = createOnboardingDto.deliveryState;
        onboardingData['trainingPostalCode'] = createOnboardingDto.deliveryPostalCode;
        onboardingData['trainingCountry'] = createOnboardingDto.deliveryCountry;
      } else {
        onboardingData['trainingAddress1'] = createOnboardingDto.trainingAddress1 || null;
        onboardingData['trainingAddress2'] = createOnboardingDto.trainingAddress2 || null;
        onboardingData['trainingCity'] = createOnboardingDto.trainingCity || null;
        onboardingData['trainingState'] = createOnboardingDto.trainingState || null;
        onboardingData['trainingPostalCode'] = createOnboardingDto.trainingPostalCode || null;
        onboardingData['trainingCountry'] = createOnboardingDto.trainingCountry || null;
      }

      console.log('Creating onboarding with data:', JSON.stringify(onboardingData, null, 2));

      const onboarding = this.onboardingRepository.create(onboardingData);
      const savedOnboarding = await this.onboardingRepository.save(onboarding);

      console.log('Onboarding saved successfully:', savedOnboarding.id);

      // Return simple object without complex relations to avoid issues
      return savedOnboarding;
    } catch (error) {
      console.error('Error in createOnboarding:', error);
      throw error;
    }
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