import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration for cloud deployment
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('StoreHub Merchant Onboarding API')
    .setDescription('API for StoreHub merchant onboarding process')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // Use PORT from environment or default to 3001
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 StoreHub Merchant Onboarding API is running on: ${await app.getUrl()}`);
  console.log(`📚 API Documentation available at: ${await app.getUrl()}/api/docs`);
}

bootstrap().catch(err => {
  console.error('❌ Error starting the application:', err);
  process.exit(1);
}); 