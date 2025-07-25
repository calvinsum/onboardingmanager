import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TrainingSlot, TrainingType, SlotStatus } from './entities/training-slot.entity';
import { Trainer, TrainerStatus } from './entities/trainer.entity';
import { Onboarding } from '../onboarding/entities/onboarding.entity';
import { RoundRobinService } from './round-robin.service';
import { TrainingSlotService } from './training-slot.service';
import {
  MerchantTrainingSlotDto,
  ManagerTrainingSlotDto,
  TrainingScheduleListDto,
  AutoAssignTrainingSlotDto,
  TrainerWorkloadDto,
  TrainingScheduleFiltersDto
} from './dto/training-schedule.dto';

@Injectable()
export class TrainingScheduleService {
  constructor(
    @InjectRepository(TrainingSlot)
    private trainingSlotRepository: Repository<TrainingSlot>,
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(Onboarding)
    private onboardingRepository: Repository<Onboarding>,
    private roundRobinService: RoundRobinService,
    private trainingSlotService: TrainingSlotService,
  ) {}

  /**
   * Get training schedules for managers (full details including trainer info)
   */
  async getTrainingSchedulesForManager(
    managerId: string,
    filters: TrainingScheduleFiltersDto
  ): Promise<TrainingScheduleListDto> {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const query = this.buildTrainingScheduleQuery(filters);

    // Add manager filter
    query.andWhere('onboarding.createdByManagerId = :managerId', { managerId });

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const trainingSlots = await query
      .skip(skip)
      .take(limit)
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.timeSlot', 'ASC')
      .getMany();

    const managerTrainingSlots = trainingSlots.map(slot =>
      this.mapToManagerDto(slot),
    );

    return {
      trainingSlots: managerTrainingSlots,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all training schedules for admin view
   */
  async getAllTrainingSchedules(
    filters: TrainingScheduleFiltersDto
  ): Promise<TrainingScheduleListDto> {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const query = this.buildTrainingScheduleQuery(filters);

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const trainingSlots = await query
      .skip(skip)
      .take(limit)
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.timeSlot', 'ASC')
      .getMany();

    const managerTrainingSlots = trainingSlots.map(slot => this.mapToManagerDto(slot));

    return {
      trainingSlots: managerTrainingSlots,
      total,
      page,
      limit
    };
  }

  /**
   * Get training schedule for merchant (limited view, no trainer details)
   */
  async getTrainingScheduleForMerchant(onboardingId: string): Promise<MerchantTrainingSlotDto[]> {
    const trainingSlots = await this.trainingSlotRepository.find({
      where: { onboardingId },
      relations: ['onboarding'],
      order: { date: 'ASC', timeSlot: 'ASC' }
    });

    return trainingSlots.map(slot => this.mapToMerchantDto(slot));
  }

  /**
   * Book training slot with automatic trainer assignment (round-robin)
   */
  async bookTrainingSlotWithAutoAssign(
    bookingDto: AutoAssignTrainingSlotDto
  ): Promise<MerchantTrainingSlotDto> {
    const { onboardingId, date, timeSlot, trainingType, location, languages } = bookingDto;
    const parsedDate = new Date(date);

    // Verify onboarding record exists
    const onboarding = await this.onboardingRepository.findOne({
      where: { id: onboardingId }
    });
    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    // Check if this onboarding record already has a training slot booked
    const existingSlot = await this.trainingSlotRepository.findOne({
      where: { 
        onboardingId,
        status: SlotStatus.BOOKED 
      },
      relations: ['onboarding']
    });

    if (existingSlot) {
      // Return the existing slot instead of creating a new one
      return this.mapToMerchantDto(existingSlot);
    }

    // Get available trainers that match the criteria
    const availableTrainers = await this.trainingSlotService['getMatchingTrainers'](
      trainingType,
      location,
      languages
    );

    if (availableTrainers.length === 0) {
      throw new BadRequestException('No trainers available for the specified requirements');
    }

    // Filter out trainers who are already booked for this time slot
    const bookedTrainerIds = await this.getBookedTrainerIds(parsedDate, timeSlot);
    const availableForSlot = availableTrainers.filter(
      trainer => !bookedTrainerIds.includes(trainer.id)
    );

    if (availableForSlot.length === 0) {
      throw new BadRequestException('No trainers available for the selected time slot');
    }

    // Use round-robin to select trainer
    const selectedTrainer = await this.roundRobinService.selectTrainerRoundRobin(
      availableForSlot,
      parsedDate,
      trainingType,
      timeSlot
    );

    if (!selectedTrainer) {
      throw new BadRequestException('Failed to assign trainer');
    }

    // Create the booking
    const trainingSlot = await this.trainingSlotService.bookTrainingSlot(
      onboardingId,
      selectedTrainer.id,
      parsedDate,
      timeSlot,
      trainingType,
      location,
      languages
    );

    // Return merchant view (no trainer details)
    return this.mapToMerchantDto(trainingSlot);
  }

  /**
   * Get trainer workload statistics
   */
  async getTrainerWorkloadStats(startDate?: Date, endDate?: Date): Promise<TrainerWorkloadDto[]> {
    const workloadStats = await this.roundRobinService.getTrainerWorkloadStats(startDate, endDate);

    return workloadStats.map(stat => ({
      trainerId: stat.trainerId,
      trainerName: stat.trainer.name,
      assignmentCount: stat.assignmentCount,
      languages: stat.trainer.languages,
      locations: stat.trainer.locations,
      status: stat.trainer.status
    }));
  }

  /**
   * Build base query for training schedules
   */
  private buildTrainingScheduleQuery(filters: TrainingScheduleFiltersDto): SelectQueryBuilder<TrainingSlot> {
    const query = this.trainingSlotRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.trainer', 'trainer')
      .leftJoinAndSelect('slot.onboarding', 'onboarding');

    // Apply filters
    if (filters.startDate) {
      query.andWhere('slot.date >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters.endDate) {
      query.andWhere('slot.date <= :endDate', { endDate: new Date(filters.endDate) });
    }

    if (filters.trainerId) {
      query.andWhere('slot.trainerId = :trainerId', { trainerId: filters.trainerId });
    }

    if (filters.status) {
      query.andWhere('slot.status = :status', { status: filters.status });
    }

    if (filters.trainingType) {
      query.andWhere('slot.trainingType = :trainingType', { trainingType: filters.trainingType });
    }

    if (filters.location) {
      query.andWhere('slot.location = :location', { location: filters.location });
    }

    return query;
  }

  /**
   * Get trainer IDs that are already booked for a specific time slot
   */
  private async getBookedTrainerIds(date: Date, timeSlot: string): Promise<string[]> {
    const bookedSlots = await this.trainingSlotRepository.find({
      where: {
        date,
        timeSlot,
        status: SlotStatus.BOOKED
      },
      select: ['trainerId']
    });

    return bookedSlots.map(slot => slot.trainerId);
  }

  /**
   * Map TrainingSlot to MerchantTrainingSlotDto (no trainer details)
   */
  private mapToMerchantDto(slot: TrainingSlot): MerchantTrainingSlotDto {
    return {
      id: slot.id,
      date: slot.date,
      timeSlot: slot.timeSlot,
      trainingType: slot.trainingType,
      location: slot.location,
      languages: slot.languages,
      status: slot.status,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      isAssigned: true, // If slot exists, trainer is assigned
      accountName: slot.onboarding?.accountName,
      trainingConfirmed: slot.onboarding?.trainingConfirmed || false
    };
  }

  /**
   * Map TrainingSlot to ManagerTrainingSlotDto (full details)
   */
  private mapToManagerDto(slot: TrainingSlot): ManagerTrainingSlotDto {
    return {
      id: slot.id,
      date: slot.date,
      timeSlot: slot.timeSlot,
      trainingType: slot.trainingType,
      location: slot.location,
      languages: slot.languages,
      status: slot.status,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      trainer: {
        id: slot.trainer.id,
        name: slot.trainer.name,
        languages: slot.trainer.languages,
        locations: slot.trainer.locations,
        status: slot.trainer.status
      },
      onboarding: {
        id: slot.onboarding.id,
        accountName: slot.onboarding.accountName,
        picName: slot.onboarding.picName,
        picEmail: slot.onboarding.picEmail,
        picPhone: slot.onboarding.picPhone,
        trainingConfirmed: slot.onboarding.trainingConfirmed,
        deliveryState: slot.onboarding.deliveryState,
        trainingState: slot.onboarding.trainingState,
        // Training address fields
        useSameAddressForTraining: slot.onboarding.useSameAddressForTraining,
        trainingAddress1: slot.onboarding.trainingAddress1,
        trainingAddress2: slot.onboarding.trainingAddress2,
        trainingCity: slot.onboarding.trainingCity,
        trainingPostalCode: slot.onboarding.trainingPostalCode,
        trainingCountry: slot.onboarding.trainingCountry,
        // Delivery address fields (for when useSameAddressForTraining is true)
        deliveryAddress1: slot.onboarding.deliveryAddress1,
        deliveryAddress2: slot.onboarding.deliveryAddress2,
        deliveryCity: slot.onboarding.deliveryCity,
        deliveryPostalCode: slot.onboarding.deliveryPostalCode,
        deliveryCountry: slot.onboarding.deliveryCountry,
      }
    };
  }

  /**
   * Debug method to check onboarding record and training slots by account name
   */
  async debugOnboardingRecord(accountName: string): Promise<any> {
    // Find onboarding record by account name
    const onboarding = await this.onboardingRepository.findOne({
      where: { accountName },
      relations: ['createdByManager']
    });

    if (!onboarding) {
      return {
        status: 'not_found',
        message: `No onboarding record found for account name: ${accountName}`,
        accountName
      };
    }

    // Find training slots for this onboarding record
    const trainingSlots = await this.trainingSlotRepository.find({
      where: { onboardingId: onboarding.id },
      relations: ['trainer', 'onboarding'],
      order: { date: 'ASC', timeSlot: 'ASC' }
    });

    return {
      status: 'found',
      onboarding: {
        id: onboarding.id,
        accountName: onboarding.accountName,
        picName: onboarding.picName,
        picEmail: onboarding.picEmail,
        trainingDate: onboarding.trainingDate,
        trainingState: onboarding.trainingState,
        trainingPreferenceLanguages: onboarding.trainingPreferenceLanguages,
        onboardingTypes: onboarding.onboardingTypes,
        createdByManager: onboarding.createdByManager ? {
          id: onboarding.createdByManager.id,
          fullName: onboarding.createdByManager.fullName,
          email: onboarding.createdByManager.email
        } : null,
        createdAt: onboarding.createdAt
      },
      trainingSlots: trainingSlots.map(slot => ({
        id: slot.id,
        date: slot.date,
        timeSlot: slot.timeSlot,
        trainingType: slot.trainingType,
        location: slot.location,
        languages: slot.languages,
        status: slot.status,
        trainer: slot.trainer ? {
          id: slot.trainer.id,
          name: slot.trainer.name,
          languages: slot.trainer.languages,
          locations: slot.trainer.locations
        } : null,
        createdAt: slot.createdAt
      })),
      totalTrainingSlots: trainingSlots.length
    };
  }

  /**
   * Update training slot status (for onboarding managers)
   */
  async updateTrainingSlotStatus(
    slotId: string, 
    status: SlotStatus, 
    managerId: string
  ): Promise<ManagerTrainingSlotDto> {
    // Find the training slot with related data
    const trainingSlot = await this.trainingSlotRepository.findOne({
      where: { id: slotId },
      relations: ['trainer', 'onboarding']
    });

    if (!trainingSlot) {
      throw new NotFoundException('Training slot not found');
    }

    // Verify that the manager who created the onboarding record is making the update
    if (trainingSlot.onboarding.createdByManagerId !== managerId) {
      throw new BadRequestException('You can only update training slots for onboarding records you created');
    }

    // Update the status
    trainingSlot.status = status;
    const updatedSlot = await this.trainingSlotRepository.save(trainingSlot);

    // Return the updated slot in manager DTO format
    return this.mapToManagerDto(updatedSlot);
  }
} 