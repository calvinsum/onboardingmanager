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

      // Only allow @storehub.com emails
      if (!email.endsWith('@storehub.com')) {
        return done(new Error('Only @storehub.com emails are allowed'), null);
      }

      // Ensure we have a display name
      const fullName = displayName || 
                      (name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : '') || 
                      email.split('@')[0];

      const user = await this.authService.validateGoogleUser({
        email,
        displayName: fullName,
        picture: photos && photos[0] ? photos[0].value : undefined,
      });

      done(null, user);
    } catch (error) {
      console.error('Google OAuth validation error:', error);
      done(error, null);
    }
  }
}
