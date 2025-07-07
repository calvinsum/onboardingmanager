import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerService } from './trainer.service';
import { TrainerController } from './trainer.controller';
import { Trainer } from './entities/trainer.entity';
import { OnboardingManager } from '../onboarding-manager/entities/onboarding-manager.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trainer, OnboardingManager])
  ],
  controllers: [TrainerController],
  providers: [TrainerService],
  exports: [TrainerService],
})
export class TrainerModule {} 