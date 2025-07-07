# Environment Variables Setup Guide

## Required Environment Variables

### Core Application Settings
```bash
NODE_ENV=production
PORT=3001
```

### Database Configuration
```bash
# Primary option - use DATABASE_URL (recommended for production)
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Alternative - individual database settings
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=storehub_onboarding
```

### JWT Authentication
```bash
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=30d
```

### Google OAuth (CRITICAL for Onboarding Manager Login)
```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_CALLBACK_URL=https://onboardingmanager.onrender.com/api/auth/google/callback
ALLOWED_OAUTH_DOMAINS=@storehub.com,@gmail.com
```

### Frontend Integration
```bash
FRONTEND_URL=https://your-frontend-url.onrender.com
```

## Google OAuth Setup Steps

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing

2. **Enable Required APIs**
   - Enable "Google+ API" or "Google People API"
   - Enable "Gmail API" (if email functionality needed)

3. **Create OAuth 2.0 Credentials**
   - Go to "Credentials" section
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"

4. **Configure OAuth Settings**
   ```
   Authorized JavaScript origins:
   - https://onboardingmanager-1.onrender.com
   - http://localhost:3000 (for development)
   
   Authorized redirect URIs:
   - https://onboardingmanager.onrender.com/api/auth/google/callback
   - http://localhost:3001/api/auth/google/callback (for development)
   ```

5. **Copy Credentials**
   - Copy the "Client ID" and "Client Secret"
   - Add them to your environment variables

## Render.com Deployment Configuration

### Environment Variables in Render Dashboard
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=generate-secure-random-string
JWT_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=https://onboardingmanager.onrender.com/api/auth/google/callback
ALLOWED_OAUTH_DOMAINS=@storehub.com,@gmail.com
FRONTEND_URL=https://storehub-merchant-onboarding-frontend.onrender.com
DATABASE_URL=postgresql://... (from database service)
```

## Testing Your Setup

1. **Health Check**
   ```bash
   curl https://onboardingmanager.onrender.com/api/health
   ```

2. **API Documentation**
   ```bash
   https://onboardingmanager.onrender.com/api/docs
   ```

3. **Google OAuth Test**
   ```bash
   https://onboardingmanager.onrender.com/api/auth/google
   ```

## Common Issues and Solutions

### 1. "Internal Server Error" on Login
- **Cause**: Missing Google OAuth credentials or domain restriction
- **Solution**: Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and ALLOWED_OAUTH_DOMAINS

### 2. "Database Connection Error"
- **Cause**: Invalid DATABASE_URL
- **Solution**: Check database connection string format

### 3. "CORS Error"
- **Cause**: Wrong FRONTEND_URL
- **Solution**: Ensure FRONTEND_URL matches your actual frontend domain

### 4. "Invalid Redirect URI"
- **Cause**: Google OAuth callback URL mismatch
- **Solution**: Update Google OAuth settings to include correct callback URL

### 5. "Email Domain Not Authorized"
- **Cause**: Your email domain is not in the allowed list
- **Solution**: Add your email domain to ALLOWED_OAUTH_DOMAINS environment variable
- **Example**: `ALLOWED_OAUTH_DOMAINS=@storehub.com,@gmail.com,@yourdomain.com`

## Security Notes

⚠️ **Important Security Considerations:**
- Never commit actual credentials to Git
- Use strong, unique JWT_SECRET
- Restrict Google OAuth to specific domains
- Use environment variables for all sensitive data
- Enable 2FA on Google Cloud Console account

## Development vs Production

### Development (.env.local)
```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
DATABASE_URL=postgresql://localhost:5432/storehub_dev
```

### Production (Render Environment Variables)
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://onboardingmanager-1.onrender.com
GOOGLE_CALLBACK_URL=https://storehub-backend.onrender.com/api/auth/google/callback
DATABASE_URL=postgresql://... (from Render database)
``` 