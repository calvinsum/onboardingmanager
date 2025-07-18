import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query, UseInterceptors, UploadedFiles, Res, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
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

  @Post()
  @ApiOperation({ summary: 'Create a new onboarding record' })
  @ApiResponse({ status: 201, description: 'Onboarding record created successfully', type: Onboarding })
  async create(
    @Body() createOnboardingDto: CreateOnboardingDto,
    @Request() req: any,
  ): Promise<Onboarding> {
    return this.onboardingService.createOnboarding(createOnboardingDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all onboarding records for the manager' })
  @ApiResponse({ status: 200, description: 'List of onboarding records', type: [Onboarding] })
  async findAll(@Request() req: any): Promise<Onboarding[]> {
    return this.onboardingService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific onboarding record' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Onboarding record found', type: Onboarding })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<Onboarding> {
    return this.onboardingService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an onboarding record' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Onboarding record updated successfully', type: Onboarding })
  async update(
    @Param('id') id: string,
    @Body() updateOnboardingDto: UpdateOnboardingDto,
    @Request() req: any,
  ): Promise<Onboarding> {
    return this.onboardingService.update(id, updateOnboardingDto, req.user.id);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get attachments for download' })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  async getAttachments(@Param('id') id: string, @Request() req: any) {
    return this.onboardingService.getAttachmentsForDownload(id, req.user.id);
  }



  // Terms and Conditions Management
  @Post('terms-conditions')
  @ApiOperation({ summary: 'Create new terms and conditions' })
  @ApiResponse({ status: 201, description: 'Terms and conditions created successfully', type: TermsConditions })
  async createTermsConditions(
    @Body() createTermsConditionsDto: CreateTermsConditionsDto,
    @Request() req: any,
  ): Promise<TermsConditions> {
    return this.termsConditionsService.createTermsConditions(createTermsConditionsDto.version, createTermsConditionsDto.content, new Date());
  }

  @Get('terms-conditions/all')
  @ApiOperation({ summary: 'Get all terms and conditions versions' })
  @ApiResponse({ status: 200, description: 'List of all terms and conditions', type: [TermsConditions] })
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
  @ApiOperation({ summary: 'Update terms and conditions' })
  @ApiParam({ name: 'id', description: 'Terms and conditions ID' })
  @ApiResponse({ status: 200, description: 'Terms and conditions updated successfully', type: TermsConditions })
  async updateTermsConditions(
    @Param('id') id: string,
    @Body() updateTermsConditionsDto: UpdateTermsConditionsDto,
    @Request() req: any,
  ): Promise<TermsConditions> {
    return this.termsConditionsService.updateTermsConditions(id, updateTermsConditionsDto.content);
  }

  @Patch('terms-conditions/:id/activate')
  @ApiOperation({ summary: 'Activate terms and conditions version' })
  @ApiParam({ name: 'id', description: 'Terms and conditions ID' })
  @ApiResponse({ status: 200, description: 'Terms and conditions activated successfully', type: TermsConditions })
  async activateTermsConditions(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<TermsConditions> {
    return this.termsConditionsService.activateTermsConditions(id);
  }
}

// Separate controller for merchant-facing endpoints (no auth required)
@ApiTags('merchant-onboarding')
@Controller('merchant-onboarding')
export class MerchantOnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly termsConditionsService: TermsConditionsService,
  ) {}

  @Get('details/:token')
  @ApiOperation({ summary: 'Get onboarding details by token' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Onboarding details', type: Onboarding })
  async getOnboardingDetails(@Param('token') token: string): Promise<Onboarding> {
    return this.onboardingService.findByToken(token);
  }

  @Post('acknowledge-terms/:token')
  @ApiOperation({ summary: 'Acknowledge terms and conditions' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Terms acknowledged successfully', type: Onboarding })
  async acknowledgeTerms(
    @Param('token') token: string,
    @Body() acknowledgeTermsDto: AcknowledgeTermsDto,
  ): Promise<Onboarding> {
    return this.onboardingService.acknowledgeTerms(token, acknowledgeTermsDto);
  }

  @Patch('update/:token')
  @ApiOperation({ summary: 'Update onboarding record by token' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Onboarding record updated successfully', type: Onboarding })
  async updateByToken(
    @Param('token') token: string,
    @Body() updateOnboardingDto: UpdateOnboardingDto,
  ): Promise<Onboarding> {
    return this.onboardingService.updateByToken(token, updateOnboardingDto);
  }

  @Patch('training-status/:token')
  @ApiOperation({ summary: 'Update training status' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Training status updated', type: Onboarding })
  async updateTrainingStatus(
    @Param('token') token: string,
    @Body() body: { status: 'completed' | 'pending' },
  ): Promise<Onboarding> {
    return this.onboardingService.updateTrainingStatus(token, body.status);
  }

  @Patch('product-setup-status/:token')
  @ApiOperation({ summary: 'Update product setup status' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Product setup status updated', type: Onboarding })
  async updateProductSetupStatus(
    @Param('token') token: string,
    @Body() body: { status: 'completed' | 'pending' },
  ): Promise<Onboarding> {
    return this.onboardingService.updateProductSetupStatus(token, body.status);
  }

  @Get('terms-conditions/active')
  @ApiOperation({ summary: 'Get active terms and conditions (public)' })
  @ApiResponse({ status: 200, description: 'Active terms and conditions', type: TermsConditions })
  async getActiveTermsConditionsPublic(): Promise<TermsConditions> {
    return this.termsConditionsService.getActiveTermsConditions();
  }

  @Post('upload-attachments/:token')
  @ApiOperation({ summary: 'Upload product setup attachments to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @UseInterceptors(FilesInterceptor('files', 10, {
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async uploadAttachments(
    @Param('token') token: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    return this.onboardingService.uploadProductSetupAttachments(token, files);
  }
}

// Public controller for file downloads (no JWT protection)
@ApiTags('file-downloads')
@Controller('files')
export class FileDownloadController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly jwtService: JwtService
  ) {}

  @Get('attachment/:attachmentId/download')
  @ApiOperation({ summary: 'Download attachment file through proxy' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'File content' })
  async downloadAttachment(@Param('attachmentId') attachmentId: string, @Query('token') token: string, @Request() req: any, @Res() res: any) {
    console.log('🔐 Download authentication attempt for attachment:', attachmentId);
    console.log('📝 Query token present:', !!token);
    console.log('📋 Auth header present:', !!req.headers.authorization);
    
    // Allow access via Bearer token (Authorization header) or query parameter token
    let managerId = req.user?.id;
    
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (!managerId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        console.log('🔍 Verifying Bearer token from header...');
        const bearerToken = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(bearerToken);
        console.log('✅ Bearer token decoded:', { type: decoded.type, sub: decoded.sub });
        
        if (decoded.type === 'onboarding_manager') {
          managerId = decoded.sub;
          console.log('✅ Manager ID from Bearer token:', managerId);
        } else {
          console.log('❌ Token type is not onboarding_manager:', decoded.type);
        }
      } catch (error) {
        console.error('❌ Invalid token in Authorization header:', error.message);
      }
    }
    
    // Fallback to query parameter token for direct browser access
    if (!managerId && token) {
      try {
        console.log('🔍 Verifying query parameter token...');
        const decoded = this.jwtService.verify(token);
        console.log('✅ Query token decoded:', { type: decoded.type, sub: decoded.sub });
        
        if (decoded.type === 'onboarding_manager') {
          managerId = decoded.sub;
          console.log('✅ Manager ID from query token:', managerId);
        } else {
          console.log('❌ Token type is not onboarding_manager:', decoded.type);
        }
      } catch (error) {
        console.error('❌ Invalid token provided via query parameter:', error.message);
      }
    }
    
    if (!managerId) {
      console.error('❌ No valid manager ID found, authentication failed');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('✅ Authentication successful for manager:', managerId);
    return this.onboardingService.downloadAttachmentProxy(attachmentId, managerId, res);
  }
}
