import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { Onboarding, OnboardingStatus } from './entities/onboarding.entity';

@ApiTags('onboarding')
@Controller('onboarding')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new onboarding record' })
  @ApiResponse({ status: 201, description: 'Onboarding record created successfully', type: Onboarding })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOnboarding(
    @Body() createOnboardingDto: CreateOnboardingDto,
    @Request() req: any,
  ): Promise<Onboarding> {
    // Debug logging
    console.log('User from JWT:', JSON.stringify(req.user, null, 2));
    const managerId = req.user.id;
    console.log('Extracted managerId:', managerId);
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
}

// Public endpoint for merchant access using token
@ApiTags('merchant-onboarding')
@Controller('merchant-onboarding')
export class MerchantOnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('access/:token')
  @ApiOperation({ summary: 'Access onboarding record using token' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Onboarding record found', type: Onboarding })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async getOnboardingByToken(@Param('token') token: string): Promise<Onboarding> {
    return this.onboardingService.getOnboardingByToken(token);
  }

  @Get('check-token/:token')
  @ApiOperation({ summary: 'Check if token is expired' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Token status', schema: { type: 'object', properties: { expired: { type: 'boolean' } } } })
  async checkTokenExpiry(@Param('token') token: string): Promise<{ expired: boolean }> {
    const expired = await this.onboardingService.isTokenExpired(token);
    return { expired };
  }
} 