import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerService } from './trainer.service';
import { TrainerController } from './trainer.controller';
import { TrainingSlotService } from './training-slot.service';
import { TrainingSlotController } from './training-slot.controller';
import { Trainer } from './entities/trainer.entity';
import { TrainingSlot } from './entities/training-slot.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';
import { Onboarding } from '../onboarding/entities/onboarding.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trainer, TrainingSlot, OnboardingManager, Onboarding])
  ],
  controllers: [TrainerController, TrainingSlotController],
  providers: [TrainerService, TrainingSlotService],
  exports: [TrainerService, TrainingSlotService],
})
export class TrainerModule {} 