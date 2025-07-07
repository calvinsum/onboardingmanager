import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrainerService } from './trainer.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { Trainer } from './entities/trainer.entity';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('trainers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('trainers')
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trainer' })
  @ApiResponse({ status: 201, description: 'Trainer created successfully', type: Trainer })
  async createTrainer(
    @Body() createTrainerDto: CreateTrainerDto,
    @Request() req: any,
  ): Promise<Trainer> {
    const managerId = req.user.id;
    return this.trainerService.createTrainer(createTrainerDto, managerId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trainers' })
  @ApiResponse({ status: 200, description: 'List of all trainers', type: [Trainer] })
  async getAllTrainers(): Promise<Trainer[]> {
    return this.trainerService.getAllTrainers();
  }

  @Get('my-trainers')
  @ApiOperation({ summary: 'Get trainers created by current manager' })
  @ApiResponse({ status: 200, description: 'List of trainers created by current manager', type: [Trainer] })
  async getMyTrainers(@Request() req: any): Promise<Trainer[]> {
    const managerId = req.user.id;
    return this.trainerService.getTrainersByManager(managerId);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available trainers by location and language' })
  @ApiResponse({ status: 200, description: 'List of available trainers', type: [Trainer] })
  async getAvailableTrainers(
    @Query('location') location?: string,
    @Query('language') language?: string,
  ): Promise<Trainer[]> {
    return this.trainerService.getAvailableTrainers(location, language);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trainer by ID' })
  @ApiResponse({ status: 200, description: 'Trainer details', type: Trainer })
  async getTrainerById(@Param('id') id: string): Promise<Trainer> {
    return this.trainerService.getTrainerById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trainer' })
  @ApiResponse({ status: 200, description: 'Trainer updated successfully', type: Trainer })
  async updateTrainer(
    @Param('id') id: string,
    @Body() updateTrainerDto: UpdateTrainerDto,
  ): Promise<Trainer> {
    return this.trainerService.updateTrainer(id, updateTrainerDto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle trainer availability status' })
  @ApiResponse({ status: 200, description: 'Trainer status toggled successfully', type: Trainer })
  async toggleTrainerStatus(@Param('id') id: string): Promise<Trainer> {
    return this.trainerService.toggleTrainerStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete trainer' })
  @ApiResponse({ status: 200, description: 'Trainer deleted successfully' })
  async deleteTrainer(@Param('id') id: string): Promise<{ message: string }> {
    await this.trainerService.deleteTrainer(id);
    return { message: 'Trainer deleted successfully' };
  }
} 