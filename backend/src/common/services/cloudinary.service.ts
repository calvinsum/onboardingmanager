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
          use_filename: true,
          unique_filename: true,
          type: 'upload', // Standard upload type
          // Remove access_mode restriction - let files be publicly accessible by default
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
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
    return cloudinary.url(publicId, {
      type: 'upload',
      secure: true,
      sign_url: false, // Ensure no signing for public access
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
}
