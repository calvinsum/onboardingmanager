# Cloudinary Setup Guide

## 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. You'll get 25GB of free storage and 25GB of monthly bandwidth

## 2. Get Your Cloudinary Credentials

1. After signing up, go to your Cloudinary Dashboard
2. You'll see your credentials in the "Account Details" section:
   - **Cloud Name**: Your unique cloud name (e.g., `dxyz123abc`)
   - **API Key**: Your API key (e.g., `123456789012345`)
   - **API Secret**: Your API secret (keep this private!)

## 3. Configure Environment Variables

### For Production (Render):
Add these environment variables to your Render service:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**⚠️ IMPORTANT**: Make sure to:
1. Add these to your Render service environment variables
2. Update the `render.yaml` file with the correct values
3. Redeploy your service after adding the variables

### For Local Development:
Create a `.env` file in the backend directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/storehub_onboarding

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=30d

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
ALLOWED_OAUTH_DOMAINS=@storehub.com,@gmail.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 4. Deploy to Production

1. Add the environment variables to your Render service
2. Deploy your updated code
3. Test the file upload functionality

## 5. File Upload Features

- ✅ **Automatic file type detection** (PDF, images, Word docs)
- ✅ **10MB file size limit**
- ✅ **Organized folders** (files stored in `product-setup-attachments/{onboarding-id}/`)
- ✅ **Direct URL access** (managers can view files directly in browser)
- ✅ **Secure uploads** (token-based authentication)

## 6. Testing Cloudinary Configuration

Run the test script to verify your Cloudinary setup:

```bash
cd backend
node test-cloudinary.js
```

This will test:
- Environment variable presence
- Cloudinary API connection
- File upload functionality

## 7. Troubleshooting

### Common Issues:

#### 1. **500 Internal Server Error on File Upload**
**Cause**: Cloudinary environment variables not properly configured
**Solution**: 
- Check that all three variables are set in Render
- Verify the values are correct (no extra spaces/quotes)
- Redeploy after adding variables

#### 2. **"Must supply cloud_name" Error**
**Cause**: `CLOUDINARY_CLOUD_NAME` is missing or undefined
**Solution**: Add the environment variable and redeploy

#### 3. **"Must supply api_key" Error**
**Cause**: `CLOUDINARY_API_KEY` is missing or undefined
**Solution**: Add the environment variable and redeploy

#### 4. **Upload failures**
**Cause**: Invalid file types or API secret issues
**Solution**: 
- Verify file types are supported (PDF, JPEG, PNG, GIF, DOC, DOCX)
- Check `CLOUDINARY_API_SECRET` is correct

#### 5. **File not showing in manager dashboard**
**Cause**: Database not saving attachment records
**Solution**: Check the database for `ProductSetupAttachment` records

### Debugging Steps:

1. **Check Environment Variables**:
   ```bash
   node test-cloudinary.js
   ```

2. **Check Application Logs**:
   - Look for Cloudinary-related errors in Render logs
   - Check for "❌ Error in uploadProductSetupAttachments" messages

3. **Test API Health**:
   ```bash
   curl https://onboardingmanager.onrender.com/api/health
   ```

4. **Test File Upload Directly**:
   ```bash
   node debug-upload.js
   ```

## 8. Cloudinary Dashboard

You can view and manage all uploaded files at:
- Dashboard: `https://cloudinary.com/console`
- Media Library: `https://cloudinary.com/console/media_library`

## 9. Required Actions

**To fix the current file upload issue:**

1. **Update render.yaml** with your actual Cloudinary credentials
2. **Redeploy** your Render service
3. **Test** the file upload functionality

**Example render.yaml update:**
```yaml
- key: CLOUDINARY_CLOUD_NAME
  value: dxyz123abc  # Replace with your actual cloud name
- key: CLOUDINARY_API_KEY
  value: 123456789012345  # Replace with your actual API key
- key: CLOUDINARY_API_SECRET
  value: your_actual_api_secret_here  # Replace with your actual API secret
``` 