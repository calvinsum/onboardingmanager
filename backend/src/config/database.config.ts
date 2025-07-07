import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const databaseUrl = this.configService.get('DATABASE_URL');
    
    // Only use DATABASE_URL in production
    if (databaseUrl && isProduction) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: !isProduction,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        extra: isProduction ? {
          ssl: {
            rejectUnauthorized: false,
          },
        } : {},
      };
    }
    
    // For local development, use local PostgreSQL with provided credentials
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: parseInt(this.configService.get('DB_PORT', '5432'), 10),
      username: this.configService.get('DB_USERNAME', 'storehub-postgress'),
      password: this.configService.get('DB_PASSWORD', 'Ku5q7Actp4yvKJI70eF6TmEwFYAgisnX'),
      database: this.configService.get('DB_NAME', 'storehub_onboarding'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: !isProduction,
      ssl: false,
    };
  }
}
