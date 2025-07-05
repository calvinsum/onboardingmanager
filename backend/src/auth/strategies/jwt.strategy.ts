import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { OnboardingManager } from '../../onboarding-manager/entities/onboarding-manager.entity';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(OnboardingManager)
    private onboardingManagerRepository: Repository<OnboardingManager>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'storehub-secret-key'),
    });
  }

  async validate(payload: JwtPayload) {
    let user;
    
    if (payload.type === 'merchant') {
      user = await this.merchantRepository.findOne({ where: { id: payload.sub } });
    } else if (payload.type === 'onboarding_manager') {
      user = await this.onboardingManagerRepository.findOne({ where: { id: payload.sub } });
      if (user && !user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user data that will be attached to request.user
    return {
      sub: user.id,
      email: user.email,
      type: payload.type,
      role: payload.role,
      user,
    };
  }
} 