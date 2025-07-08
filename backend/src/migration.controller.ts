import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding, OnboardingType } from './onboarding/entities/onboarding.entity';
import { TrainingSlot, TrainingType, SlotStatus } from './trainer/entities/training-slot.entity';
import { Trainer, TrainerStatus, TrainerLanguage } from './trainer/entities/trainer.entity';
import { format } from 'date-fns';

@Controller('migration')
export class MigrationController {
  constructor(
    @InjectRepository(Onboarding) private onboardingRepository: Repository<Onboarding>,
    @InjectRepository(TrainingSlot) private trainingSlotRepository: Repository<TrainingSlot>,
    @InjectRepository(Trainer) private trainerRepository: Repository<Trainer>,
  ) {}

  @Get('status')
  async getStatus() {
    return {
      message: 'Migration endpoint is available',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('training-slots')
  async migrateTrainingSlots() {
    const onboardingRepository = this.onboardingRepository;
    const trainingSlotRepository = this.trainingSlotRepository;
    const trainerRepository = this.trainerRepository;
    
    const results = {
      status: 'started',
      timestamp: new Date().toISOString(),
      totalFound: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[],
    };

    try {
      // Find all onboarding records that have training dates but no corresponding training slots
      const onboardingsWithTrainingDates = await onboardingRepository
        .createQueryBuilder('onboarding')
        .leftJoinAndSelect('onboarding.createdByManager', 'manager')
        .where('onboarding.trainingDate IS NOT NULL')
        .getMany();

      results.totalFound = onboardingsWithTrainingDates.length;
      results.details.push(`Found ${onboardingsWithTrainingDates.length} onboarding records with training dates`);

      for (const onboarding of onboardingsWithTrainingDates) {
        try {
          // Check if training slot already exists for this onboarding
          const existingSlot = await trainingSlotRepository.findOne({
            where: { onboardingId: onboarding.id }
          });

          if (existingSlot) {
            results.details.push(`Skipping ${onboarding.accountName} - training slot already exists`);
            results.skipped++;
            continue;
          }

          // Determine training type based on onboarding types
          const hasRemoteTraining = onboarding.onboardingTypes?.includes(OnboardingType.REMOTE_TRAINING);
          const hasOnsiteTraining = onboarding.onboardingTypes?.includes(OnboardingType.ONSITE_TRAINING);
          
          const trainingType = hasOnsiteTraining && !hasRemoteTraining 
            ? TrainingType.ONSITE 
            : TrainingType.REMOTE;

          // Extract time slot from training date
          const trainingDate = new Date(onboarding.trainingDate!);
          const timeSlot = format(trainingDate, 'HH:mm');
          const dateOnly = format(trainingDate, 'yyyy-MM-dd');

          // Find available trainers for this training type and requirements
          const trainersQuery = trainerRepository.createQueryBuilder('trainer')
            .where('trainer.status = :status', { status: TrainerStatus.ACTIVE });

          // For onsite training, location must match
          if (trainingType === TrainingType.ONSITE && onboarding.trainingState) {
            trainersQuery.andWhere('trainer.locations LIKE :location', { 
              location: `%${onboarding.trainingState}%` 
            });
          }

          // If languages are specified, trainer must support at least one
          if (onboarding.trainingPreferenceLanguages && onboarding.trainingPreferenceLanguages.length > 0) {
            const languageConditions = onboarding.trainingPreferenceLanguages.map((lang, index) => 
              `trainer.languages LIKE :lang${index}`
            ).join(' OR ');
            
            const languageParams: any = {};
            onboarding.trainingPreferenceLanguages.forEach((lang, index) => {
              languageParams[`lang${index}`] = `%${lang}%`;
            });

            trainersQuery.andWhere(`(${languageConditions})`, languageParams);
          }

          const availableTrainers = await trainersQuery.getMany();

          if (availableTrainers.length === 0) {
            results.details.push(`No trainers available for ${onboarding.accountName} (${trainingType}, ${onboarding.trainingState})`);
            results.errors++;
            continue;
          }

          // Check for conflicts at the same time slot
          const conflictingSlots = await trainingSlotRepository.find({
            where: {
              date: trainingDate,
              timeSlot: timeSlot,
              status: SlotStatus.BOOKED
            }
          });

          const bookedTrainerIds = conflictingSlots.map(slot => slot.trainerId);
          const availableForSlot = availableTrainers.filter(
            trainer => !bookedTrainerIds.includes(trainer.id)
          );

          if (availableForSlot.length === 0) {
            results.details.push(`No trainers available for time slot ${timeSlot} on ${dateOnly} for ${onboarding.accountName}`);
            results.errors++;
            continue;
          }

          // Simple assignment - pick the first available trainer
          const selectedTrainer = availableForSlot[0];

          // Create the training slot
          const trainingSlot = trainingSlotRepository.create({
            date: trainingDate,
            timeSlot: timeSlot,
            trainingType: trainingType,
            location: trainingType === TrainingType.ONSITE ? onboarding.trainingState : null,
            languages: onboarding.trainingPreferenceLanguages || [],
            trainerId: selectedTrainer.id,
            onboardingId: onboarding.id,
            status: SlotStatus.BOOKED
          });

          await trainingSlotRepository.save(trainingSlot);

          results.details.push(`Created training slot for ${onboarding.accountName} (${trainingType}) with trainer ${selectedTrainer.name} on ${dateOnly} ${timeSlot}`);
          results.migrated++;

        } catch (error) {
          results.details.push(`Error processing ${onboarding.accountName}: ${error.message}`);
          results.errors++;
        }
      }

      results.status = 'completed';
      results.details.push('Migration completed successfully');

    } catch (error) {
      results.status = 'failed';
      results.details.push(`Migration failed: ${error.message}`);
    }

    return results;
  }

  @Post('add-selangor-trainer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add trainer for Selangor + Malay + onsite training' })
  @ApiResponse({ status: 200, description: 'Trainer added successfully' })
  async addSelangorTrainer() {
    try {
      // Check if trainer already exists
      const existingTrainer = await this.trainerRepository.findOne({
        where: { name: 'Ahmad Rahman' }
      });

      if (existingTrainer) {
        return {
          success: true,
          message: 'Trainer Ahmad Rahman already exists',
          trainer: existingTrainer
        };
      }

      // Create new trainer for Selangor + Malay + onsite training
      const trainer = this.trainerRepository.create({
        name: 'Ahmad Rahman',
        languages: [TrainerLanguage.MALAY, TrainerLanguage.ENGLISH],
        locations: ['Selangor', 'Kuala Lumpur'],
        status: TrainerStatus.ACTIVE,
        createdByManagerId: null // System created
      });

      const savedTrainer = await this.trainerRepository.save(trainer);

      return {
        success: true,
        message: 'Successfully added trainer Ahmad Rahman for Selangor + Malay training',
        trainer: savedTrainer
      };

    } catch (error) {
      console.error('Error adding trainer:', error);
      return {
        success: false,
        message: 'Failed to add trainer',
        error: error.message
      };
    }
  }
} 