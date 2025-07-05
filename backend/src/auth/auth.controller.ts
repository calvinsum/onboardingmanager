import { Controller, Post, Body, Request, UseGuards, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMerchantDto } from './dto/register-merchant.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('merchant/login')
  @ApiOperation({ summary: 'Merchant login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginMerchant(@Body() loginDto: LoginDto) {
    return this.authService.loginMerchant(loginDto.email, loginDto.password);
  }

  @Post('merchant/register')
  @ApiOperation({ summary: 'Merchant registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Merchant already exists' })
  async registerMerchant(@Body() registerDto: RegisterMerchantDto) {
    return this.authService.registerMerchant(registerDto.email, registerDto.password);
  }

  @Post('onboarding-manager/login')
  @ApiOperation({ summary: 'Onboarding manager login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginOnboardingManager(@Body() loginDto: LoginDto) {
    return this.authService.loginOnboardingManager(loginDto.email, loginDto.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login for onboarding managers' })
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Request() req, @Res() res: Response) {
    try {
      const result = await this.authService.loginWithGoogle(req.user);
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'https://onboardingmanager-1.onrender.com';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://onboardingmanager-1.onrender.com';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async refreshToken(@Request() req) {
    const { sub: userId, type } = req.user;
    return this.authService.refreshToken(userId, type);
  }
}
