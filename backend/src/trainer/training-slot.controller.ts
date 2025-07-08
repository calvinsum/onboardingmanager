import { Controller, Get, Post, Body, Param, Query, UseGuards, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TrainingSlotService, AvailableSlot, TrainingAvailability } from './training-slot.service';
import { TrainingSlot, TrainingType } from './entities/training-slot.entity';

export class BookTrainingSlotDto {
  onboardingId: string;
  trainerId: string;
  date: string;
  timeSlot: string;
  trainingType: TrainingType;
  location?: string;
  languages?: string[];
}

@ApiTags('training-slots')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('training-slots')
export class TrainingSlotController {
  constructor(private readonly trainingSlotService: TrainingSlotService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Get available training slots for a specific date' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'trainingType', enum: TrainingType, description: 'Type of training' })
  @ApiQuery({ name: 'location', required: false, description: 'Location (state) for onsite training' })
  @ApiQuery({ name: 'languages', required: false, description: 'Comma-separated list of required languages' })
  @ApiResponse({ status: 200, description: 'Available slots retrieved successfully' })
  async getAvailableSlots(
    @Query('date') date: string,
    @Query('trainingType') trainingType: TrainingType,
    @Query('location') location?: string,
    @Query('languages') languagesStr?: string,
  ): Promise<AvailableSlot[]> {
    const parsedDate = new Date(date);
    const languages = languagesStr ? languagesStr.split(',').map(lang => lang.trim()) : undefined;
    
    return this.trainingSlotService.getAvailableSlots(
      parsedDate,
      trainingType,
      location,
      languages
    );
  }

  @Get('availability/range')
  @ApiOperation({ summary: 'Get availability for a date range' })
  @ApiQuery({ name: 'startDate', description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'trainingType', enum: TrainingType, description: 'Type of training' })
  @ApiQuery({ name: 'location', required: false, description: 'Location (state) for onsite training' })
  @ApiQuery({ name: 'languages', required: false, description: 'Comma-separated list of required languages' })
  @ApiResponse({ status: 200, description: 'Availability range retrieved successfully' })
  async getAvailabilityForDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('trainingType') trainingType: TrainingType,
    @Query('location') location?: string,
    @Query('languages') languagesStr?: string,
  ): Promise<TrainingAvailability[]> {
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    const languages = languagesStr ? languagesStr.split(',').map(lang => lang.trim()) : undefined;
    
    return this.trainingSlotService.getAvailabilityForDateRange(
      parsedStartDate,
      parsedEndDate,
      trainingType,
      location,
      languages
    );
  }

  @Post('book')
  @ApiOperation({ summary: 'Book a training slot' })
  @ApiResponse({ status: 201, description: 'Training slot booked successfully', type: TrainingSlot })
  async bookTrainingSlot(@Body() bookingDto: BookTrainingSlotDto): Promise<TrainingSlot> {
    const parsedDate = new Date(bookingDto.date);
    
    return this.trainingSlotService.bookTrainingSlot(
      bookingDto.onboardingId,
      bookingDto.trainerId,
      parsedDate,
      bookingDto.timeSlot,
      bookingDto.trainingType,
      bookingDto.location,
      bookingDto.languages
    );
  }

  @Get('onboarding/:onboardingId')
  @ApiOperation({ summary: 'Get training slots for an onboarding record' })
  @ApiResponse({ status: 200, description: 'Training slots retrieved successfully', type: [TrainingSlot] })
  async getSlotsByOnboarding(@Param('onboardingId') onboardingId: string): Promise<TrainingSlot[]> {
    return this.trainingSlotService.getSlotsByOnboarding(onboardingId);
  }

  @Get('trainer/:trainerId')
  @ApiOperation({ summary: 'Get training slots for a trainer' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({ status: 200, description: 'Training slots retrieved successfully', type: [TrainingSlot] })
  async getSlotsByTrainer(
    @Param('trainerId') trainerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TrainingSlot[]> {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    
    return this.trainingSlotService.getSlotsByTrainer(trainerId, parsedStartDate, parsedEndDate);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a training slot' })
  @ApiResponse({ status: 200, description: 'Training slot cancelled successfully', type: TrainingSlot })
  async cancelTrainingSlot(@Param('id') id: string): Promise<TrainingSlot> {
    return this.trainingSlotService.cancelTrainingSlot(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a training slot as completed' })
  @ApiResponse({ status: 200, description: 'Training slot marked as completed', type: TrainingSlot })
  async completeTrainingSlot(@Param('id') id: string): Promise<TrainingSlot> {
    return this.trainingSlotService.completeTrainingSlot(id);
  }
} 