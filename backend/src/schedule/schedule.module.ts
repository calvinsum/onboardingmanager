import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Onboarding } from '../onboarding/entities/onboarding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Onboarding])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}