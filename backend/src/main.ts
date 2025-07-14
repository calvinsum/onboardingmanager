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
    origin: [
      'https://onboardingmanager-1.onrender.com',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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

  // Auto-create Terms & Conditions if they don't exist
  await createInitialTermsIfNeeded(app);

  // Use PORT from environment or default to 3001
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 StoreHub Merchant Onboarding API is running on: ${await app.getUrl()}`);
  console.log(`📚 API Documentation available at: ${await app.getUrl()}/api/docs`);
}

async function createInitialTermsIfNeeded(app: any) {
  try {
    const { TermsConditionsService } = await import('./onboarding/terms-conditions.service');
    const termsService = app.get(TermsConditionsService);
    
    // Check if active terms exist
    try {
      await termsService.getActiveTermsConditions();
      console.log('✅ Terms & Conditions already exist');
      return;
    } catch (error) {
      // No active terms found, create them
      console.log('📝 Creating initial Terms & Conditions...');
    }

    const termsContent = `# StoreHub Merchant Onboarding Terms and Conditions

**Version:** 1.1
**Effective Date:** January 1, 2025

## 1. ACCEPTANCE OF TERMS

By proceeding with the StoreHub merchant onboarding process, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). These Terms constitute a legally binding agreement between you ("Merchant") and StoreHub Sdn Bhd ("StoreHub", "we", "us", or "our").

## 2. ONBOARDING PROCESS

### 2.1 Hardware Delivery

* StoreHub will deliver the necessary point-of-sale hardware to your specified delivery address.
* Delivery timelines are estimates and may vary based on location and circumstances.
* You are responsible for ensuring someone is available to receive the delivery.
* Any damage during delivery must be reported within 24 hours.

### 2.2 Installation Services

* Professional installation services will be scheduled at your convenience.
* You must provide a suitable environment for hardware installation, including accessible Wi-Fi, LAN cables, and power points.
* Installation includes basic setup and initial configuration.
* Additional customization may incur extra charges.

### 2.3 Training Requirements

* Mandatory training sessions will be conducted either remotely or on-site.
* Training covers system operation, basic troubleshooting, and best practices.
* All designated staff members must complete the training program.
* Additional training sessions may be requested at standard rates. Training sessions conducted outside normal working hours or on public holidays may be requested at non-standard rates.

## 3. MERCHANT OBLIGATIONS

### 3.1 Information Accuracy

* All information provided during onboarding must be accurate and complete.
* You must promptly notify us of any changes to your business details.
* False or misleading information may result in service termination.

### 3.2 Compliance

* You agree to comply with all applicable laws and regulations.
* Your business must maintain all necessary licenses and permits.
* You are responsible for tax compliance and reporting.

### 3.3 System Usage

* The StoreHub system must be used in accordance with our usage guidelines.
* Unauthorized modifications or tampering is strictly prohibited.
* You are responsible for maintaining the security of your login credentials.

## 4. SERVICE LEVEL AGREEMENTS

### 4.2 Support Services

* Technical support available during business hours.
* Emergency support for critical issues.
* Regular system updates and maintenance.

## 5. FEES AND PAYMENT

### 5.3 Payment & Contact Responsibility

* All outstanding payments must be fully settled no later than 72 hours before the scheduled go-live date. Failure to do so may result in postponement or suspension of service activation.
* The Merchant is responsible for ensuring the availability of the designated contact person during scheduled installation and training. Changes to contact details must be communicated at least 24 working hours in advance.

## 6. STORE SETUP AND SCHEDULING TERMS

### 6.1 Store Setup Readiness

* Merchants must submit the complete product list at least seven (7) working days prior to the scheduled go-live date.
* Clear photos or proof of store readiness (e.g., setup area, Wi-Fi, LAN cables, power outlets) must be provided upon request.
* If the store is not ready on the scheduled date, StoreHub reserves the right to reschedule. Rescheduling fees as per StoreHub's service policy will apply.

### 6.2 Scheduling & Delivery

* Once an installation or training date is confirmed, changes made less than 48 hours prior are subject to rescheduling charges.
* StoreHub is not liable for delivery issues if the Merchant or representative is not present at the confirmed delivery time. Redelivery, if applicable, may incur additional charges.

## 7. DATA PROTECTION AND PRIVACY

### 7.1 Data Collection

* We collect and process data necessary for service provision.
* All data handling complies with applicable privacy laws.
* You retain ownership of your business data.

### 7.2 Data Security

* We implement industry-standard security measures.
* Regular security audits and updates.
* Incident response procedures in place.

## 8. LIABILITY AND WARRANTIES

### 8.1 Service Warranties

* We warrant that services will be provided with reasonable care and skill.
* Hardware warranties as per manufacturer specifications.
* Software functionality as described in documentation.

### 8.2 Limitation of Liability

* Our liability is limited to the value of services provided.
* We are not liable for indirect or consequential damages.
* Force majeure events are excluded from liability.

## 9. TERMINATION

### 9.1 Termination Rights

* Either party may terminate with 30 days written notice.
* Immediate termination for material breach.
* Termination procedures and data return.

### 9.2 Post-Termination

* Return of hardware and materials.
* Data export and deletion procedures.
* Final billing and settlement.

## 10. INTELLECTUAL PROPERTY

### 10.1 StoreHub IP

* All StoreHub software and systems remain our property.
* Limited license granted for business use only.
* No reverse engineering or copying permitted.

### 10.2 Merchant IP

* You retain ownership of your business data and content.
* License granted to us for service provision purposes.
* Confidentiality of proprietary information.

## 11. GENERAL PROVISIONS

### 11.1 Governing Law

* These Terms are governed by Malaysian law.
* Disputes subject to Malaysian court jurisdiction.
* Alternative dispute resolution procedures.

### 11.2 Amendments

* We may update these Terms with reasonable notice.
* Continued use constitutes acceptance of changes.
* Material changes require explicit consent.

### 11.3 Severability

* Invalid provisions do not affect remaining Terms.
* Reasonable interpretation of ambiguous clauses.
* Good faith performance expected.

## 12. CONTACT INFORMATION

For questions about these Terms and Conditions, please contact:

**StoreHub Sdn Bhd**
Email: [care@storehub.com](mailto:care@storehub.com)
Contact No: +60392126688

**By clicking "Agree and Continue", you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.**

*Last Updated: January 1, 2025*`;

    const terms = await termsService.createTermsConditions(
      '1.1',
      termsContent,
      new Date('2025-01-01')
    );

    console.log('✅ Terms and Conditions created successfully!');
    console.log(`📄 Version: ${terms.version}`);
    console.log(`🆔 ID: ${terms.id}`);
    console.log(`📅 Effective Date: ${terms.effectiveDate}`);
    console.log(`✅ Active: ${terms.isActive}`);
    
  } catch (error) {
    console.error('❌ Error creating Terms and Conditions:', error);
    
    if (error.message?.includes('duplicate')) {
      console.log('💡 Terms and Conditions may already exist.');
    }
  }
}

bootstrap().catch(err => {
  console.error('❌ Error starting the application:', err);
  process.exit(1);
}); 