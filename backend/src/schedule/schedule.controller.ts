import { Controller, Get, Param, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Schedule')
@Controller('api/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('holidays/:year')
  @ApiOperation({ summary: 'Get public holidays for a given year and state' })
  @ApiParam({ name: 'year', description: 'The year to get holidays for', type: 'number' })
  @ApiQuery({ name: 'state', description: 'The state to get holidays for (e.g., "10" for Selangor)', required: false, type: 'string' })
  getPublicHolidays(
    @Param('year') year: number,
    @Query('state') state?: string,
  ) {
    return this.scheduleService.getPublicHolidays(year, state);
  }
} 