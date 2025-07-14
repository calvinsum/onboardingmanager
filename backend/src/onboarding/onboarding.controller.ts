import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';
import { TermsConditionsService } from './terms-conditions.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { AcknowledgeTermsDto, CreateTermsConditionsDto, UpdateTermsConditionsDto } from './dto/acknowledge-terms.dto';
import { Onboarding, OnboardingStatus } from './entities/onboarding.entity';
import { TermsConditions } from './entities/terms-conditions.entity';

@ApiTags('onboarding')
@Controller('onboarding')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly termsConditionsService: TermsConditionsService,
  ) {}

  @Get('debug')
  @ApiOperation({ summary: 'Debug endpoint to test authentication and manager lookup' })
  async debugAuth(@Request() req: any): Promise<any> {
    try {
      console.log('=== DEBUG ENDPOINT ===');
      console.log('User from JWT:', JSON.stringify(req.user, null, 2));
      
      const managerId = req.user.id;
      console.log('Extracted managerId:', managerId);
      
      // Test manager lookup
      const result = await this.onboardingService.debugManagerLookup(managerId);
      
      return {
        success: true,
        user: req.user,
        managerId,
        managerFound: result.found,
        manager: result.manager,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Debug endpoint error:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new onboarding record' })
  @ApiResponse({ status: 201, description: 'Onboarding record created successfully', type: Onboarding })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOnboarding(
    @Body() createOnboardingDto: CreateOnboardingDto,
    @Request() req: any,
  ): Promise<Onboarding> {
    const managerId = req.user.id;
    return this.onboardingService.createOnboarding(createOnboardingDto, managerId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all onboarding records' })
  @ApiResponse({ status: 200, description: 'List of onboarding records', type: [Onboarding] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllOnboardings(): Promise<Onboarding[]> {
    return this.onboardingService.getAllOnboardings();
  }

  @Get('my-records')
  @ApiOperation({ summary: 'Get onboarding records created by current manager' })
  @ApiResponse({ status: 200, description: 'List of onboarding records', type: [Onboarding] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyOnboardings(@Request() req: any): Promise<Onboarding[]> {
    const managerId = req.user.id;
    return this.onboardingService.getOnboardingsByManager(managerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get onboarding record by ID' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Onboarding record found', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Onboarding record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOnboardingById(@Param('id') id: string): Promise<Onboarding> {
    return this.onboardingService.getOnboardingById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an onboarding record' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Onboarding record updated successfully', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Onboarding record not found' })
  async updateOnboarding(
    @Param('id') id: string,
    @Body() updateOnboardingDto: UpdateOnboardingDto,
  ): Promise<Onboarding> {
    return this.onboardingService.updateOnboarding(id, updateOnboardingDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update onboarding status' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Onboarding status updated', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Onboarding record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateOnboardingStatus(
    @Param('id') id: string,
    @Body('status') status: OnboardingStatus,
  ): Promise<Onboarding> {
    return this.onboardingService.updateOnboardingStatus(id, status);
  }

  @Post(':id/regenerate-token')
  @ApiOperation({ summary: 'Regenerate access token for onboarding' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Token regenerated successfully', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Onboarding record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async regenerateToken(@Param('id') id: string): Promise<Onboarding> {
    return this.onboardingService.regenerateToken(id);
  }

  @Patch(':id/link-merchant')
  @ApiOperation({ summary: 'Link merchant to onboarding record' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Merchant linked successfully', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Onboarding or merchant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async linkMerchant(
    @Param('id') id: string,
    @Body('merchantId') merchantId: string,
  ): Promise<Onboarding> {
    return this.onboardingService.linkMerchant(id, merchantId);
  }

  // Terms and Conditions Management (Manager only)
  @Post('terms-conditions')
  @ApiOperation({ summary: 'Create new terms and conditions' })
  @ApiResponse({ status: 201, description: 'Terms and conditions created successfully', type: TermsConditions })
  async createTermsConditions(
    @Body() createTermsConditionsDto: CreateTermsConditionsDto,
  ): Promise<TermsConditions> {
    return this.termsConditionsService.createTermsConditions(
      createTermsConditionsDto.version,
      createTermsConditionsDto.content,
      new Date(createTermsConditionsDto.effectiveDate),
    );
  }

  @Get('terms-conditions')
  @ApiOperation({ summary: 'Get all terms and conditions versions' })
  @ApiResponse({ status: 200, description: 'List of terms and conditions', type: [TermsConditions] })
  async getAllTermsConditions(): Promise<TermsConditions[]> {
    return this.termsConditionsService.getAllTermsConditions();
  }

  @Get('terms-conditions/active')
  @ApiOperation({ summary: 'Get active terms and conditions' })
  @ApiResponse({ status: 200, description: 'Active terms and conditions', type: TermsConditions })
  async getActiveTermsConditions(): Promise<TermsConditions> {
    return this.termsConditionsService.getActiveTermsConditions();
  }

  @Patch('terms-conditions/:id')
  @ApiOperation({ summary: 'Update terms and conditions content' })
  @ApiParam({ name: 'id', description: 'Terms and conditions ID' })
  @ApiResponse({ status: 200, description: 'Terms and conditions updated successfully', type: TermsConditions })
  async updateTermsConditions(
    @Param('id') id: string,
    @Body() updateTermsConditionsDto: UpdateTermsConditionsDto,
  ): Promise<TermsConditions> {
    return this.termsConditionsService.updateTermsConditions(id, updateTermsConditionsDto.content);
  }

  @Patch('terms-conditions/:id/activate')
  @ApiOperation({ summary: 'Activate terms and conditions version' })
  @ApiParam({ name: 'id', description: 'Terms and conditions ID' })
  @ApiResponse({ status: 200, description: 'Terms and conditions activated successfully', type: TermsConditions })
  async activateTermsConditions(@Param('id') id: string): Promise<TermsConditions> {
    return this.termsConditionsService.activateTermsConditions(id);
  }
}

// Public endpoint for merchant access using token
@ApiTags('merchant-onboarding')
@Controller('merchant-onboarding')
export class MerchantOnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly termsConditionsService: TermsConditionsService,
  ) {}

  @Get('access/:token')
  @ApiOperation({ summary: 'Access onboarding record using token' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Onboarding record found', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async getOnboardingByToken(@Param('token') token: string): Promise<Onboarding> {
    return this.onboardingService.getOnboardingByToken(token);
  }

  @Patch('update/:token')
  @ApiOperation({ summary: 'Update onboarding schedule using access token' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Onboarding schedule updated successfully', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async updateOnboardingByToken(
    @Param('token') token: string,
    @Body() updateOnboardingDto: UpdateOnboardingDto,
  ): Promise<Onboarding> {
    return this.onboardingService.updateOnboardingByToken(token, updateOnboardingDto);
  }

  @Get('check-token/:token')
  @ApiOperation({ summary: 'Check if token is expired' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Token status', schema: { type: 'object', properties: { expired: { type: 'boolean' } } } })
  async checkTokenExpiry(@Param('token') token: string): Promise<{ expired: boolean }> {
    const expired = await this.onboardingService.isTokenExpired(token);
    return { expired };
  }

  // Terms and Conditions for Merchants
  @Get('terms-conditions/check/:token')
  @ApiOperation({ summary: 'Check terms and conditions acknowledgment status' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Terms acknowledgment status' })
  async checkTermsAcknowledgment(@Param('token') token: string): Promise<{ acknowledged: boolean; currentTerms?: TermsConditions }> {
    return this.onboardingService.checkTermsAcknowledgmentByToken(token);
  }

  @Post('terms-conditions/acknowledge/:token')
  @ApiOperation({ summary: 'Acknowledge terms and conditions' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Terms and conditions acknowledged successfully', type: Onboarding })
  async acknowledgeTerms(
    @Param('token') token: string,
    @Body() acknowledgeTermsDto: AcknowledgeTermsDto,
  ): Promise<Onboarding> {
    return this.onboardingService.acknowledgeTermsByToken(token, acknowledgeTermsDto);
  }

  @Get('terms-conditions/active')
  @ApiOperation({ summary: 'Get active terms and conditions (public)' })
  @ApiResponse({ status: 200, description: 'Active terms and conditions', type: TermsConditions })
  async getActiveTermsConditionsPublic(): Promise<TermsConditions> {
    return this.termsConditionsService.getActiveTermsConditions();
  }
} 