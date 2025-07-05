import { Controller, Get, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingManagerService } from './onboarding-manager.service';
import { OnboardingManager, OnboardingManagerRole } from './entities/onboarding-manager.entity';

@ApiTags('Onboarding Managers')
@Controller('onboarding-managers')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OnboardingManagerController {
  constructor(private readonly onboardingManagerService: OnboardingManagerService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get onboarding manager profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    const { sub: managerId } = req.user;
    return this.onboardingManagerService.findOne(managerId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update onboarding manager profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateData: Partial<OnboardingManager>) {
    const { sub: managerId } = req.user;
    return this.onboardingManagerService.updateProfile(managerId, updateData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all onboarding managers (admin only)' })
  @ApiResponse({ status: 200, description: 'Managers retrieved successfully' })
  async findAll() {
    return this.onboardingManagerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get onboarding manager by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Manager retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Manager not found' })
  async findOne(@Param('id') id: string) {
    return this.onboardingManagerService.findOne(id);
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Update manager role (admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async updateRole(@Param('id') id: string, @Body('role') role: OnboardingManagerRole) {
    return this.onboardingManagerService.updateRole(id, role);
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle manager active status (admin only)' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  async toggleActiveStatus(@Param('id') id: string) {
    return this.onboardingManagerService.toggleActiveStatus(id);
  }
}
