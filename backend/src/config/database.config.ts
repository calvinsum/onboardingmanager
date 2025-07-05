import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const databaseUrl = this.configService.get('DATABASE_URL');
    
    // If DATABASE_URL is provided, use it directly
    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: !isProduction, // Only sync in development
        logging: !isProduction,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        extra: isProduction ? {
          ssl: {
            rejectUnauthorized: false,
          },
        } : {},
      };
    }
    
    // Fallback to individual environment variables
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: parseInt(this.configService.get('DB_PORT', '5432'), 10),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'password'),
      database: this.configService.get('DB_NAME', 'storehub_onboarding'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: !isProduction, // Only sync in development
      logging: !isProduction,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      extra: isProduction ? {
        ssl: {
          rejectUnauthorized: false,
        },
      } : {},
    };
  }
}
