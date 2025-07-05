import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingManager, OnboardingManagerRole } from './entities/onboarding-manager.entity';

@Injectable()
export class OnboardingManagerService {
  constructor(
    @InjectRepository(OnboardingManager)
    private onboardingManagerRepository: Repository<OnboardingManager>,
  ) {}

  async findAll(): Promise<OnboardingManager[]> {
    return this.onboardingManagerRepository.find({
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });
  }

  async findOne(id: string): Promise<OnboardingManager> {
    const manager = await this.onboardingManagerRepository.findOne({
      where: { id },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });

    if (!manager) {
      throw new NotFoundException('Onboarding manager not found');
    }

    return manager;
  }

  async updateProfile(id: string, updateData: Partial<OnboardingManager>): Promise<OnboardingManager> {
    const manager = await this.findOne(id);
    
    // Remove sensitive fields that shouldn't be updated directly
    const { password, ...safeUpdateData } = updateData;
    
    await this.onboardingManagerRepository.update(id, safeUpdateData);
    return this.findOne(id);
  }

  async updateRole(id: string, role: OnboardingManagerRole): Promise<OnboardingManager> {
    const manager = await this.findOne(id);
    await this.onboardingManagerRepository.update(id, { role });
    return this.findOne(id);
  }

  async toggleActiveStatus(id: string): Promise<OnboardingManager> {
    const manager = await this.findOne(id);
    await this.onboardingManagerRepository.update(id, { isActive: !manager.isActive });
    return this.findOne(id);
  }

  async findByEmail(email: string): Promise<OnboardingManager | null> {
    return this.onboardingManagerRepository.findOne({ where: { email } });
  }
}
