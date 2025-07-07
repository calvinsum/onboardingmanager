import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Merchant } from '../merchant/entities/merchant.entity';
import { OnboardingManager, OnboardingManagerRole } from '../onboarding-manager/entities/onboarding-manager.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'merchant' | 'onboarding_manager';
  role?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(OnboardingManager)
    private onboardingManagerRepository: Repository<OnboardingManager>,
    private jwtService: JwtService,
  ) {}

  async validateMerchant(email: string, password: string): Promise<any> {
    const merchant = await this.merchantRepository.findOne({ where: { email } });
    
    if (merchant && await bcrypt.compare(password, merchant.password)) {
      const { password, ...result } = merchant;
      return result;
    }
    return null;
  }

  async validateOnboardingManager(email: string, password: string): Promise<any> {
    const manager = await this.onboardingManagerRepository.findOne({ where: { email } });
    
    if (manager && await bcrypt.compare(password, manager.password)) {
      const { password, ...result } = manager;
      return result;
    }
    return null;
  }

  async loginMerchant(email: string, password: string) {
    const merchant = await this.validateMerchant(email, password);
    if (!merchant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: merchant.id,
      email: merchant.email,
      type: 'merchant',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: merchant.id,
        email: merchant.email,
        type: 'merchant',
      },
    };
  }

  async loginOnboardingManager(email: string, password: string) {
    try {
      const manager = await this.validateOnboardingManager(email, password);
      if (!manager) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if manager is active
      if (!manager.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const payload: JwtPayload = {
        sub: manager.id,
        email: manager.email,
        type: 'onboarding_manager',
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: manager.id,
          email: manager.email,
          type: 'onboarding_manager',
        },
      };
    } catch (error) {
      console.error('Onboarding manager login error:', error);
      throw error;
    }
  }

  async refreshToken(userId: string, userType: 'merchant' | 'onboarding_manager') {
    let user;
    
    if (userType === 'merchant') {
      user = await this.merchantRepository.findOne({ where: { id: userId } });
    } else {
      user = await this.onboardingManagerRepository.findOne({ where: { id: userId } });
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: userType,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        type: userType,
      },
    };
  }

  async registerMerchant(email: string, password: string) {
    // Check if merchant already exists
    const existingMerchant = await this.merchantRepository.findOne({ where: { email } });
    if (existingMerchant) {
      throw new ConflictException('Merchant with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new merchant
    const merchant = this.merchantRepository.create({
      email,
      password: hashedPassword,
    });

    const savedMerchant = await this.merchantRepository.save(merchant);

    // Return JWT token
    const payload: JwtPayload = {
      sub: savedMerchant.id,
      email: savedMerchant.email,
      type: 'merchant',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: savedMerchant.id,
        email: savedMerchant.email,
        type: 'merchant',
      },
    };
  }

  async validateGoogleUser(googleUser: {
    email: string;
    displayName: string;
    picture?: string;
  }) {
    try {
      // Find the user by email
      let manager = await this.onboardingManagerRepository.findOne({ 
        where: { email: googleUser.email } 
      });

      // If the user doesn't exist, we create them.
      if (!manager) {
        // Check if this is the very first user.
        const totalManagers = await this.onboardingManagerRepository.count();
        const isFirstUser = totalManagers === 0;

        manager = this.onboardingManagerRepository.create({
          email: googleUser.email,
          fullName: googleUser.displayName || googleUser.email.split("@")[0],
          oauthProvider: "google",
          // The first user to sign up is automatically an ADMIN
          role: isFirstUser ? OnboardingManagerRole.ADMIN : OnboardingManagerRole.MANAGER,
          isActive: true, // Automatically activate Google users
        });
        
        manager = await this.onboardingManagerRepository.save(manager);
      }

      // If the user exists but is not active, throw an error
      if (!manager.isActive) {
        throw new UnauthorizedException('Your account has been deactivated.');
      }

      // Return JWT token
      const payload: JwtPayload = {
        sub: manager.id,
        email: manager.email,
        type: "onboarding_manager",
        role: manager.role, // Include the role in the JWT payload
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: manager.id,
          email: manager.email,
          fullName: manager.fullName,
          type: "onboarding_manager",
          role: manager.role,
        },
      };
    } catch (error) {
      console.error("Error in validateGoogleUser:", error);
      throw new Error("Failed to validate Google user");
    }
  }
  async loginWithGoogle(user: any) {
    try {
      // Process the Google user and create/update onboarding manager
      const result = await this.validateGoogleUser({
        email: user.email,
        displayName: user.displayName || user.name,
        picture: user.picture
      });
      
      return result;
    } catch (error) {
      console.error('Error in loginWithGoogle:', error);
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }
}
