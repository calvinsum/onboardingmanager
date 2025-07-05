import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MerchantModule } from './merchant/merchant.module';
import { OnboardingManagerModule } from './onboarding-manager/onboarding-manager.module';
import { HealthModule } from './health/health.module';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Configuration module - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 