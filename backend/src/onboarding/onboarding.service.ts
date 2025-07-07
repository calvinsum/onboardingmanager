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
    // Verify manager exists
    const manager = await this.onboardingManagerRepository.findOne({
      where: { id: managerId }
    });

    if (!manager) {
      throw new NotFoundException('Onboarding manager not found');
    }

    // Generate unique access token
    const accessToken = this.generateAccessToken();
    
    // Set token expiry to 30 days from now
    const tokenExpiryDate = new Date();
    tokenExpiryDate.setDate(tokenExpiryDate.getDate() + 30);

    // Create onboarding record
    const onboarding = this.onboardingRepository.create({
      ...createOnboardingDto,
      accessToken,
      tokenExpiryDate,
      createdByManagerId: managerId,
      status: OnboardingStatus.CREATED,
    });

    // If useSameAddressForTraining is true, copy delivery address to training address
    if (createOnboardingDto.useSameAddressForTraining) {
      onboarding.trainingAddress1 = createOnboardingDto.deliveryAddress1;
      onboarding.trainingAddress2 = createOnboardingDto.deliveryAddress2;
      onboarding.trainingCity = createOnboardingDto.deliveryCity;
      onboarding.trainingState = createOnboardingDto.deliveryState;
      onboarding.trainingPostalCode = createOnboardingDto.deliveryPostalCode;
      onboarding.trainingCountry = createOnboardingDto.deliveryCountry;
    }

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    // Return onboarding with relationships
    return this.onboardingRepository.findOne({
      where: { id: savedOnboarding.id },
      relations: ['createdByManager', 'merchant'],
    });
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
} 