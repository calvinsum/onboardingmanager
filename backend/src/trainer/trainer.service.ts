import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer, TrainerStatus } from './entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';

@Injectable()
export class TrainerService {
  constructor(
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(OnboardingManager)
    private onboardingManagerRepository: Repository<OnboardingManager>,
  ) {}

  async createTrainer(createTrainerDto: CreateTrainerDto, managerId: string): Promise<Trainer> {
    // Verify manager exists (optional to avoid blocking creation)
    try {
      const manager = await this.onboardingManagerRepository.findOne({
        where: { id: managerId }
      });

      if (!manager) {
        console.warn(`Manager with ID ${managerId} not found, but proceeding with trainer creation`);
      }
    } catch (error) {
      console.warn('Error verifying manager, proceeding with trainer creation:', error);
    }

    const trainer = this.trainerRepository.create({
      ...createTrainerDto,
      createdByManagerId: managerId,
      status: TrainerStatus.ACTIVE,
    });

    return this.trainerRepository.save(trainer);
  }

  async getAllTrainers(): Promise<Trainer[]> {
    return this.trainerRepository.find({
      relations: ['createdByManager'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTrainersByManager(managerId: string): Promise<Trainer[]> {
    return this.trainerRepository.find({
      where: { createdByManagerId: managerId },
      relations: ['createdByManager'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTrainerById(id: string): Promise<Trainer> {
    const trainer = await this.trainerRepository.findOne({
      where: { id },
      relations: ['createdByManager'],
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    return trainer;
  }

  async updateTrainer(id: string, updateTrainerDto: UpdateTrainerDto): Promise<Trainer> {
    const trainer = await this.getTrainerById(id);
    
    // Merge the updates
    const updatedTrainer = this.trainerRepository.merge(trainer, updateTrainerDto);
    
    return this.trainerRepository.save(updatedTrainer);
  }

  async toggleTrainerStatus(id: string): Promise<Trainer> {
    const trainer = await this.getTrainerById(id);
    
    trainer.status = trainer.status === TrainerStatus.ACTIVE 
      ? TrainerStatus.INACTIVE 
      : TrainerStatus.ACTIVE;
    
    return this.trainerRepository.save(trainer);
  }

  async deleteTrainer(id: string): Promise<void> {
    const trainer = await this.getTrainerById(id);
    await this.trainerRepository.remove(trainer);
  }

  // Get active trainers by location and language
  async getAvailableTrainers(location?: string, language?: string): Promise<Trainer[]> {
    const query = this.trainerRepository.createQueryBuilder('trainer')
      .where('trainer.status = :status', { status: TrainerStatus.ACTIVE });

    if (location) {
      query.andWhere('trainer.locations LIKE :location', { location: `%${location}%` });
    }

    if (language) {
      query.andWhere('trainer.languages LIKE :language', { language: `%${language}%` });
    }

    return query
      .leftJoinAndSelect('trainer.createdByManager', 'manager')
      .orderBy('trainer.name', 'ASC')
      .getMany();
  }
} 