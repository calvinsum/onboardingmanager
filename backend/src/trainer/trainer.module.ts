import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerService } from './trainer.service';
import { TrainerController } from './trainer.controller';
import { TrainingSlotService } from './training-slot.service';
import { TrainingSlotController, PublicTrainingSlotController } from './training-slot.controller';
import { RoundRobinService } from './round-robin.service';
import { TrainingScheduleService } from './training-schedule.service';
import { TrainingScheduleController, MerchantTrainingScheduleController } from './training-schedule.controller';
import { Trainer } from './entities/trainer.entity';
import { TrainingSlot } from './entities/training-slot.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';
import { Onboarding } from '../onboarding/entities/onboarding.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trainer, TrainingSlot, OnboardingManager, Onboarding])
  ],
  controllers: [
    TrainerController, 
    TrainingSlotController, 
    PublicTrainingSlotController,
    TrainingScheduleController, 
    MerchantTrainingScheduleController
  ],
  providers: [
    TrainerService, 
    TrainingSlotService, 
    RoundRobinService, 
    TrainingScheduleService
  ],
  exports: [
    TrainerService, 
    TrainingSlotService, 
    RoundRobinService, 
    TrainingScheduleService
  ],
})
export class TrainerModule {} 