import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { emails, displayName, photos, name } = profile;
      
      if (!emails || !emails[0] || !emails[0].value) {
        return done(new Error('No email found in Google profile'), null);
      }

      const email = emails[0].value;

      // Allow configurable domain patterns for onboarding managers
      const allowedDomainsEnv = this.configService.get('ALLOWED_OAUTH_DOMAINS', '@storehub.com');
      const allowedDomains = allowedDomainsEnv.split(',').map(domain => domain.trim());
      const isAllowedDomain = allowedDomains.some(domain => email.endsWith(domain));
      
      if (!isAllowedDomain) {
        return done(new Error(`Email domain not authorized. Allowed domains: ${allowedDomains.join(', ')}`), null);
      }

      // Ensure we have a display name
      const fullName = displayName || 
                      (name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : '') || 
                      email.split('@')[0];

      // Return user profile data for the controller to process
      const userProfile = {
        email,
        displayName: fullName,
        picture: photos && photos[0] ? photos[0].value : undefined,
      };

      done(null, userProfile);
    } catch (error) {
      console.error('Google OAuth validation error:', error);
      done(error, null);
    }
  }
}
