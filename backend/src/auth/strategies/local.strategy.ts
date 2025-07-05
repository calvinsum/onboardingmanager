import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    // Try to validate as merchant first
    const merchant = await this.authService.validateMerchant(email, password);
    if (merchant) {
      return { ...merchant, type: 'merchant' };
    }

    // Try to validate as onboarding manager
    const manager = await this.authService.validateOnboardingManager(email, password);
    if (manager) {
      return { ...manager, type: 'onboarding_manager' };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
} 