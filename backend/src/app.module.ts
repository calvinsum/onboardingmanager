import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './auth/auth.module';
import { MerchantModule } from './merchant/merchant.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OnboardingManagerModule } from './onboarding-manager/onboarding-manager.module';
import { TrainerModule } from './trainer/trainer.module';
import { ScheduleModule } from './schedule/schedule.module';
import { HealthModule } from './health/health.module';
import { MigrationController } from './migration.controller';

import { DatabaseConfig } from './config/database.config';
import { Onboarding } from './onboarding/entities/onboarding.entity';
import { TrainingSlot } from './trainer/entities/training-slot.entity';
import { Trainer } from './trainer/entities/trainer.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),
    // Add TypeORM repositories for MigrationController
    TypeOrmModule.forFeature([Onboarding, TrainingSlot, Trainer]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,
    MerchantModule,
    OnboardingModule,
    OnboardingManagerModule,
    TrainerModule,
    ScheduleModule,
    HealthModule,
  ],
  controllers: [MigrationController],
  providers: [],
})
export class AppModule {} 