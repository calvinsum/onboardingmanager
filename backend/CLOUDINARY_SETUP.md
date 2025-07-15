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

Add these environment variables to your production environment (Render):

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### For Local Development:
Create a `.env` file in the backend directory:

```bash
# Copy from .env.example and fill in your values
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
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

## 6. Testing

1. Create a new onboarding record
2. Use the merchant token to upload files
3. Check the manager dashboard to view uploaded files
4. Files should open directly in new browser tabs

## 7. Troubleshooting

- **500 errors**: Check that all environment variables are set correctly
- **Upload failures**: Verify file types are supported (PDF, JPEG, PNG, GIF, DOC, DOCX)
- **File not showing**: Check the database for `ProductSetupAttachment` records

## 8. Cloudinary Dashboard

You can view and manage all uploaded files at:
- Dashboard: `https://cloudinary.com/console`
- Media Library: `https://cloudinary.com/console/media_library` 