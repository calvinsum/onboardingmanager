import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MerchantModule } from './merchant/merchant.module';
import { OnboardingManagerModule } from './onboarding-manager/onboarding-manager.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { HealthModule } from './health/health.module';
import { ScheduleModule } from './schedule/schedule.module';
import { TrainerModule } from './trainer/trainer.module';
import { DatabaseConfig } from './config/database.config';
import { scheduleConfig } from './config/schedule.config';

@Module({
  imports: [
    // Configuration module - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [scheduleConfig],
    }),
    
    // Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),
    
    // Feature modules
    AuthModule,
    MerchantModule,
    OnboardingManagerModule,
    HealthModule,
    OnboardingModule,
    ScheduleModule,
    TrainerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 