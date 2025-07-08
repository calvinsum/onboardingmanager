import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  BadRequestException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TrainingScheduleService } from './training-schedule.service';
import {
  MerchantTrainingSlotDto,
  ManagerTrainingSlotDto,
  TrainingScheduleListDto,
  AutoAssignTrainingSlotDto,
  TrainerWorkloadDto,
  TrainingScheduleFiltersDto
} from './dto/training-schedule.dto';

@ApiTags('training-schedules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('training-schedules')
export class TrainingScheduleController {
  constructor(private readonly trainingScheduleService: TrainingScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all training schedules (Admin/Manager view with trainer details)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'trainerId', required: false, description: 'Filter by trainer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'trainingType', required: false, description: 'Filter by training type' })
  @ApiQuery({ name: 'location', required: false, description: 'Filter by location' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Training schedules retrieved successfully', 
    type: TrainingScheduleListDto 
  })
  async getAllTrainingSchedules(
    @Query() filters: TrainingScheduleFiltersDto
  ): Promise<TrainingScheduleListDto> {
    return this.trainingScheduleService.getAllTrainingSchedules(filters);
  }

  @Get('manager/:managerId')
  @ApiOperation({ summary: 'Get training schedules for a specific manager' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'trainerId', required: false, description: 'Filter by trainer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'trainingType', required: false, description: 'Filter by training type' })
  @ApiQuery({ name: 'location', required: false, description: 'Filter by location' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Manager training schedules retrieved successfully', 
    type: TrainingScheduleListDto 
  })
  async getTrainingSchedulesForManager(
    @Param('managerId') managerId: string,
    @Query() filters: TrainingScheduleFiltersDto
  ): Promise<TrainingScheduleListDto> {
    return this.trainingScheduleService.getTrainingSchedulesForManager(managerId, filters);
  }

  @Get('my-schedules')
  @ApiOperation({ summary: 'Get training schedules for the current manager' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'trainerId', required: false, description: 'Filter by trainer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'trainingType', required: false, description: 'Filter by training type' })
  @ApiQuery({ name: 'location', required: false, description: 'Filter by location' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current manager training schedules retrieved successfully', 
    type: TrainingScheduleListDto 
  })
  async getMyTrainingSchedules(
    @Request() req: any,
    @Query() filters: TrainingScheduleFiltersDto
  ): Promise<TrainingScheduleListDto> {
    try {
      console.log('=== Training Schedules Debug ===');
      console.log('User object:', req.user);
      console.log('Manager ID:', req.user?.sub);
      console.log('Filters received:', filters);
      
      const managerId = req.user.sub;
      
      if (!managerId) {
        console.error('No manager ID found in request');
        throw new BadRequestException('Manager ID not found in authentication token');
      }
      
      console.log('Calling service with managerId:', managerId);
      const result = await this.trainingScheduleService.getTrainingSchedulesForManager(managerId, filters);
      console.log('Service result:', result);
      
      return result;
    } catch (error) {
      console.error('Error in getMyTrainingSchedules:', error);
      throw error;
    }
  }

  @Post('book-auto-assign')
  @ApiOperation({ summary: 'Book training slot with automatic trainer assignment (round-robin)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Training slot booked successfully with auto-assigned trainer', 
    type: MerchantTrainingSlotDto 
  })
  @ApiResponse({ status: 400, description: 'No trainers available or invalid request' })
  @ApiResponse({ status: 404, description: 'Onboarding record not found' })
  async bookTrainingSlotWithAutoAssign(
    @Body() bookingDto: AutoAssignTrainingSlotDto
  ): Promise<MerchantTrainingSlotDto> {
    return this.trainingScheduleService.bookTrainingSlotWithAutoAssign(bookingDto);
  }

  @Get('trainer-workload')
  @ApiOperation({ summary: 'Get trainer workload statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for workload calculation' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for workload calculation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trainer workload statistics retrieved successfully', 
    type: [TrainerWorkloadDto] 
  })
  async getTrainerWorkloadStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TrainerWorkloadDto[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.trainingScheduleService.getTrainerWorkloadStats(start, end);
  }
}

// Separate controller for merchant endpoints (limited access, no trainer details)
@ApiTags('merchant-training-schedules')
@Controller('merchant-training-schedules')
export class MerchantTrainingScheduleController {
  constructor(private readonly trainingScheduleService: TrainingScheduleService) {}

  @Get('onboarding/:onboardingId')
  @ApiOperation({ summary: 'Get training schedule for merchant (no trainer details exposed)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Merchant training schedule retrieved successfully', 
    type: [MerchantTrainingSlotDto] 
  })
  @ApiResponse({ status: 404, description: 'Onboarding record not found' })
  async getTrainingScheduleForMerchant(
    @Param('onboardingId') onboardingId: string
  ): Promise<MerchantTrainingSlotDto[]> {
    return this.trainingScheduleService.getTrainingScheduleForMerchant(onboardingId);
  }

  @Post('book-auto-assign')
  @ApiOperation({ summary: 'Book training slot for merchant with automatic trainer assignment' })
  @ApiResponse({ 
    status: 201, 
    description: 'Training slot booked successfully (trainer assigned automatically)', 
    type: MerchantTrainingSlotDto 
  })
  @ApiResponse({ status: 400, description: 'No trainers available or invalid request' })
  @ApiResponse({ status: 404, description: 'Onboarding record not found' })
  async bookTrainingSlotForMerchant(
    @Body() bookingDto: AutoAssignTrainingSlotDto
  ): Promise<MerchantTrainingSlotDto> {
    return this.trainingScheduleService.bookTrainingSlotWithAutoAssign(bookingDto);
  }
} 