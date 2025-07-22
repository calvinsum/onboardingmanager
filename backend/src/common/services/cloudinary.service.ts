import { Injectable } from '@nestjs/common';
import { CloudinaryConfig } from '../../config/cloudinary.config';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private cloudinaryConfig: CloudinaryConfig) {}

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'product-setup-attachments'
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const cloudinary = this.cloudinaryConfig.getCloudinary();
      
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          use_filename: false,      // DO NOT use the original filename
          unique_filename: true,    // Generate a unique random string instead
          type: 'upload',
          access_mode: 'public', // Explicitly set to public
          invalidate: true, // Invalidate CDN cache
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('❌ Cloudinary upload stream error:', error);
            reject(error);
          } else if (result) {
            console.log('✅☁️ Cloudinary upload successful. Full result object:');
            console.log(JSON.stringify(result, null, 2));
            // DO NOT override the URL. Use the one provided by Cloudinary directly.
            // It is the source of truth for the resource's location.
            console.log('☁️ Upload successful. Using direct secure_url from Cloudinary:', result.secure_url);
            resolve(result);
          } else {
            console.error('❌ Cloudinary upload failed with no result.');
            reject(new Error('Upload failed with no result'));
          }
        }
      ).end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<any> {
    const cloudinary = this.cloudinaryConfig.getCloudinary();
    return cloudinary.uploader.destroy(publicId);
  }

  getFileUrl(publicId: string): string {
    const cloudinary = this.cloudinaryConfig.getCloudinary();
    // Force public URL generation
    return cloudinary.url(publicId, {
      type: 'upload',
      secure: true,
    });
  }

  // Generate public URL that should be accessible without authentication
  getPublicFileUrl(publicId: string): string {
    const cloudinary = this.cloudinaryConfig.getCloudinary();
    
    // This is the simplest and most reliable way to get the URL for a public resource.
    return cloudinary.url(publicId, {
      resource_type: 'auto',
      secure: true,
    });
  }

  // Generate a signed URL for secure access (if needed in future)
  getSecureFileUrl(publicId: string, expirationTime: number = 3600): string {
    const cloudinary = this.cloudinaryConfig.getCloudinary();
    return cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + expirationTime, // Expires in 1 hour by default
    });
  }

  generateSignedUrl(publicId: string, options: { isDownload: boolean, filename: string, resourceType: string }): string {
    const cloudinary = this.cloudinaryConfig.getCloudinary();
    const { isDownload, filename, resourceType } = options;
    
    // The signing process uses the API Key and Secret from the server's environment.
    // We do not pass the 'format' for raw files as the public_id is the complete identifier.
    const signedUrl = cloudinary.utils.private_download_url(publicId, '', {
      resource_type: resourceType,
      type: 'upload',
      attachment: isDownload,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // URL is valid for 1 hour
    });

    return signedUrl;
  }

  async listRecentAssets(folder: string): Promise<any[]> {
    const cloudinary = this.cloudinaryConfig.getCloudinary();
    // This uses the Admin API and requires the API Key and Secret to be configured correctly.
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 10,
      direction: 'desc', // Most recent first
    });
    return result.resources;
  }
}
