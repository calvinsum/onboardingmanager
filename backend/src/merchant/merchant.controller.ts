import { Controller, Get, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MerchantService } from './merchant.service';
import { Merchant, MerchantStatus } from './entities/merchant.entity';

@ApiTags('Merchants')
@Controller('merchants')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get merchant profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    const { sub: merchantId } = req.user;
    return this.merchantService.findOne(merchantId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update merchant profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateData: Partial<Merchant>) {
    const { sub: merchantId } = req.user;
    return this.merchantService.updateProfile(merchantId, updateData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all merchants (admin only)' })
  @ApiResponse({ status: 200, description: 'Merchants retrieved successfully' })
  async findAll() {
    return this.merchantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Merchant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async findOne(@Param('id') id: string) {
    return this.merchantService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update merchant status (admin only)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: MerchantStatus) {
    return this.merchantService.updateStatus(id, status);
  }
}
