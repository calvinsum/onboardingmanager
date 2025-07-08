import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingSlot, TrainingType, SlotStatus } from './entities/training-slot.entity';
import { Trainer, TrainerStatus } from './entities/trainer.entity';
import { Onboarding } from '../onboarding/entities/onboarding.entity';

export interface AvailableSlot {
  timeSlot: string;
  availableTrainers: {
    id: string;
    name: string;
    languages: string[];
    locations: string[];
  }[];
}

export interface TrainingAvailability {
  date: string;
  availableSlots: AvailableSlot[];
}

@Injectable()
export class TrainingSlotService {
  constructor(
    @InjectRepository(TrainingSlot)
    private trainingSlotRepository: Repository<TrainingSlot>,
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(Onboarding)
    private onboardingRepository: Repository<Onboarding>,
  ) {}

  // Standard time slots available for training
  private readonly TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  /**
   * Get available training slots for a specific date based on merchant requirements
   */
  async getAvailableSlots(
    date: Date,
    trainingType: TrainingType,
    location?: string,
    languages?: string[]
  ): Promise<AvailableSlot[]> {
    // Get all active trainers that match the criteria
    const availableTrainers = await this.getMatchingTrainers(trainingType, location, languages);

    // Get already booked slots for this date
    const bookedSlots = await this.trainingSlotRepository.find({
      where: {
        date,
        status: SlotStatus.BOOKED
      },
      relations: ['trainer']
    });

    // Create a map of booked slots by time and trainer
    const bookedSlotMap = new Map<string, Set<string>>();
    bookedSlots.forEach(slot => {
      if (!bookedSlotMap.has(slot.timeSlot)) {
        bookedSlotMap.set(slot.timeSlot, new Set());
      }
      bookedSlotMap.get(slot.timeSlot)!.add(slot.trainerId);
    });

    // Calculate available slots
    const availableSlots: AvailableSlot[] = [];

    for (const timeSlot of this.TIME_SLOTS) {
      const bookedTrainerIds = bookedSlotMap.get(timeSlot) || new Set();
      const availableTrainersForSlot = availableTrainers.filter(
        trainer => !bookedTrainerIds.has(trainer.id)
      );

      if (availableTrainersForSlot.length > 0) {
        availableSlots.push({
          timeSlot,
          availableTrainers: availableTrainersForSlot.map(trainer => ({
            id: trainer.id,
            name: trainer.name,
            languages: trainer.languages,
            locations: trainer.locations
          }))
        });
      }
    }

    return availableSlots;
  }

  /**
   * Get trainers that match the training requirements
   */
  private async getMatchingTrainers(
    trainingType: TrainingType,
    location?: string,
    languages?: string[]
  ): Promise<Trainer[]> {
    const query = this.trainerRepository.createQueryBuilder('trainer')
      .where('trainer.status = :status', { status: TrainerStatus.ACTIVE });

    // For onsite training, location must match
    if (trainingType === TrainingType.ONSITE && location) {
      query.andWhere('trainer.locations LIKE :location', { location: `%${location}%` });
    }

    // If languages are specified, trainer must support at least one
    if (languages && languages.length > 0) {
      const languageConditions = languages.map((lang, index) => 
        `trainer.languages LIKE :lang${index}`
      ).join(' OR ');
      
      const languageParams: any = {};
      languages.forEach((lang, index) => {
        languageParams[`lang${index}`] = `%${lang}%`;
      });

      query.andWhere(`(${languageConditions})`, languageParams);
    }

    return query.getMany();
  }

  /**
   * Book a training slot
   */
  async bookTrainingSlot(
    onboardingId: string,
    trainerId: string,
    date: Date,
    timeSlot: string,
    trainingType: TrainingType,
    location?: string,
    languages?: string[]
  ): Promise<TrainingSlot> {
    // Verify onboarding record exists
    const onboarding = await this.onboardingRepository.findOne({
      where: { id: onboardingId }
    });
    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    // Verify trainer exists and is available
    const trainer = await this.trainerRepository.findOne({
      where: { id: trainerId, status: TrainerStatus.ACTIVE }
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found or not available');
    }

    // Check if trainer matches requirements
    if (trainingType === TrainingType.ONSITE && location) {
      if (!trainer.locations.includes(location)) {
        throw new BadRequestException('Trainer is not available in the requested location');
      }
    }

         if (languages && languages.length > 0) {
       const hasMatchingLanguage = languages.some(lang => 
         trainer.languages.some(trainerLang => trainerLang === lang)
       );
       if (!hasMatchingLanguage) {
         throw new BadRequestException('Trainer does not support the requested languages');
       }
     }

    // Check if slot is already booked for this trainer
    const existingSlot = await this.trainingSlotRepository.findOne({
      where: {
        date,
        timeSlot,
        trainerId,
        status: SlotStatus.BOOKED
      }
    });

    if (existingSlot) {
      throw new BadRequestException('This time slot is already booked for the selected trainer');
    }

    // Create the booking
    const trainingSlot = this.trainingSlotRepository.create({
      date,
      timeSlot,
      trainingType,
      location: trainingType === TrainingType.ONSITE ? location : null,
      languages: languages || [],
      trainerId,
      onboardingId,
      status: SlotStatus.BOOKED
    });

    return this.trainingSlotRepository.save(trainingSlot);
  }

  /**
   * Automatically assign and book a training slot with round-robin trainer selection
   */
  async autoAssignTrainingSlot(
    onboardingId: string,
    date: Date,
    timeSlot: string,
    trainingType: TrainingType,
    location?: string,
    languages?: string[]
  ): Promise<TrainingSlot> {
    // Verify onboarding record exists
    const onboarding = await this.onboardingRepository.findOne({
      where: { id: onboardingId }
    });
    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    // Get all trainers that match the requirements
    const matchingTrainers = await this.getMatchingTrainers(trainingType, location, languages);
    
    if (matchingTrainers.length === 0) {
      throw new BadRequestException('No trainers available for the specified requirements');
    }

    // Filter out trainers who are already booked for this time slot
    const availableTrainers = [];
    for (const trainer of matchingTrainers) {
      const existingSlot = await this.trainingSlotRepository.findOne({
        where: {
          date,
          timeSlot,
          trainerId: trainer.id,
          status: SlotStatus.BOOKED
        }
      });
      
      if (!existingSlot) {
        availableTrainers.push(trainer);
      }
    }

    if (availableTrainers.length === 0) {
      throw new BadRequestException('No trainers available for the specified time slot');
    }

    // Round-robin selection: get trainer with least recent assignments
    const selectedTrainer = await this.selectTrainerRoundRobin(availableTrainers);

    // Create the booking with auto-assigned trainer
    const trainingSlot = this.trainingSlotRepository.create({
      date,
      timeSlot,
      trainingType,
      location: trainingType === TrainingType.ONSITE ? location : null,
      languages: languages || [],
      trainerId: selectedTrainer.id,
      onboardingId,
      status: SlotStatus.BOOKED
    });

    return this.trainingSlotRepository.save(trainingSlot);
  }

  /**
   * Select trainer using round-robin algorithm based on assignment history
   */
  private async selectTrainerRoundRobin(availableTrainers: Trainer[]): Promise<Trainer> {
    // Get assignment counts for each trainer
    const trainerAssignments = await Promise.all(
      availableTrainers.map(async (trainer) => {
        const assignmentCount = await this.trainingSlotRepository.count({
          where: { 
            trainerId: trainer.id,
            status: SlotStatus.BOOKED 
          }
        });

        // Get the most recent assignment date
        const lastAssignment = await this.trainingSlotRepository.findOne({
          where: { 
            trainerId: trainer.id,
            status: SlotStatus.BOOKED 
          },
          order: { createdAt: 'DESC' }
        });

        return {
          trainer,
          assignmentCount,
          lastAssignmentDate: lastAssignment?.createdAt || new Date(0)
        };
      })
    );

    // Sort by assignment count (ascending), then by last assignment date (ascending)
    // This ensures fair distribution and gives priority to trainers with fewer assignments
    trainerAssignments.sort((a, b) => {
      if (a.assignmentCount !== b.assignmentCount) {
        return a.assignmentCount - b.assignmentCount;
      }
      return a.lastAssignmentDate.getTime() - b.lastAssignmentDate.getTime();
    });

    return trainerAssignments[0].trainer;
  }

  /**
   * Cancel a training slot booking
   */
  async cancelTrainingSlot(slotId: string): Promise<TrainingSlot> {
    const slot = await this.trainingSlotRepository.findOne({
      where: { id: slotId },
      relations: ['trainer', 'onboarding']
    });

    if (!slot) {
      throw new NotFoundException('Training slot not found');
    }

    slot.status = SlotStatus.CANCELLED;
    return this.trainingSlotRepository.save(slot);
  }

  /**
   * Get training slots for a specific onboarding record
   */
  async getSlotsByOnboarding(onboardingId: string): Promise<TrainingSlot[]> {
    return this.trainingSlotRepository.find({
      where: { onboardingId },
      relations: ['trainer', 'onboarding'],
      order: { date: 'ASC', timeSlot: 'ASC' }
    });
  }

  /**
   * Get training slots for a specific trainer
   */
  async getSlotsByTrainer(trainerId: string, startDate?: Date, endDate?: Date): Promise<TrainingSlot[]> {
    const query = this.trainingSlotRepository.createQueryBuilder('slot')
      .leftJoinAndSelect('slot.trainer', 'trainer')
      .leftJoinAndSelect('slot.onboarding', 'onboarding')
      .where('slot.trainerId = :trainerId', { trainerId })
      .andWhere('slot.status = :status', { status: SlotStatus.BOOKED });

    if (startDate) {
      query.andWhere('slot.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('slot.date <= :endDate', { endDate });
    }

    return query
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.timeSlot', 'ASC')
      .getMany();
  }

  /**
   * Mark a training slot as completed
   */
  async completeTrainingSlot(slotId: string): Promise<TrainingSlot> {
    const slot = await this.trainingSlotRepository.findOne({
      where: { id: slotId },
      relations: ['trainer', 'onboarding']
    });

    if (!slot) {
      throw new NotFoundException('Training slot not found');
    }

    slot.status = SlotStatus.COMPLETED;
    return this.trainingSlotRepository.save(slot);
  }

  /**
   * Get availability for multiple dates (useful for calendar view)
   */
  async getAvailabilityForDateRange(
    startDate: Date,
    endDate: Date,
    trainingType: TrainingType,
    location?: string,
    languages?: string[]
  ): Promise<TrainingAvailability[]> {
    const availability: TrainingAvailability[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const availableSlots = await this.getAvailableSlots(
          new Date(currentDate),
          trainingType,
          location,
          languages
        );

        if (availableSlots.length > 0) {
          availability.push({
            date: currentDate.toISOString().split('T')[0],
            availableSlots
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availability;
  }
} 