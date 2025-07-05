import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant, MerchantStatus } from './entities/merchant.entity';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
  ) {}

  async findAll(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      select: ['id', 'email', 'businessName', 'contactPersonName', 'status', 'createdAt', 'updatedAt'],
    });
  }

  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      select: ['id', 'email', 'businessName', 'businessRegistrationNumber', 'contactPersonName', 'contactPhone', 'businessAddress', 'businessCategory', 'status', 'isEmailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return merchant;
  }

  async updateProfile(id: string, updateData: Partial<Merchant>): Promise<Merchant> {
    const merchant = await this.findOne(id);
    
    // Remove sensitive fields that shouldn't be updated directly
    const { password, emailVerificationToken, passwordResetToken, ...safeUpdateData } = updateData;
    
    await this.merchantRepository.update(id, safeUpdateData);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: MerchantStatus): Promise<Merchant> {
    const merchant = await this.findOne(id);
    await this.merchantRepository.update(id, { status });
    return this.findOne(id);
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    return this.merchantRepository.findOne({ where: { email } });
  }

  async getMerchantsByStatus(status: MerchantStatus): Promise<Merchant[]> {
    return this.merchantRepository.find({
      where: { status },
      select: ['id', 'email', 'businessName', 'contactPersonName', 'status', 'createdAt', 'updatedAt'],
    });
  }
}
