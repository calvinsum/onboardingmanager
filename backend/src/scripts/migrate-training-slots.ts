import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Onboarding, OnboardingType } from '../onboarding/entities/onboarding.entity';
import { TrainingSlot, TrainingType, SlotStatus } from '../trainer/entities/training-slot.entity';
import { Trainer, TrainerStatus } from '../trainer/entities/trainer.entity';
import { format } from 'date-fns';

async function migrateTrainingSlots() {
  console.log('🚀 Starting training slots migration...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const onboardingRepository = dataSource.getRepository(Onboarding);
  const trainingSlotRepository = dataSource.getRepository(TrainingSlot);
  const trainerRepository = dataSource.getRepository(Trainer);
  
  try {
    // Find all onboarding records that have training dates but no corresponding training slots
    const onboardingsWithTrainingDates = await onboardingRepository
      .createQueryBuilder('onboarding')
      .leftJoinAndSelect('onboarding.createdByManager', 'manager')
      .where('onboarding.trainingDate IS NOT NULL')
      .getMany();

    console.log(`📊 Found ${onboardingsWithTrainingDates.length} onboarding records with training dates`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const onboarding of onboardingsWithTrainingDates) {
      try {
        // Check if training slot already exists for this onboarding
        const existingSlot = await trainingSlotRepository.findOne({
          where: { onboardingId: onboarding.id }
        });

        if (existingSlot) {
          console.log(`⏭️  Skipping ${onboarding.accountName} - training slot already exists`);
          skippedCount++;
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
          console.log(`❌ No trainers available for ${onboarding.accountName} (${trainingType}, ${onboarding.trainingState})`);
          errorCount++;
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
          console.log(`⚠️  No trainers available for time slot ${timeSlot} on ${dateOnly} for ${onboarding.accountName}`);
          errorCount++;
          continue;
        }

        // Simple assignment - pick the first available trainer
        // In production, this would use round-robin logic
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

        console.log(`✅ Created training slot for ${onboarding.accountName} (${trainingType}) with trainer ${selectedTrainer.name} on ${dateOnly} ${timeSlot}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error processing ${onboarding.accountName}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} training slots`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    console.log(`📊 Total processed: ${onboardingsWithTrainingDates.length} records`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await app.close();
    console.log('🏁 Migration script completed');
  }
}

// Run the migration
migrateTrainingSlots().catch(console.error); 