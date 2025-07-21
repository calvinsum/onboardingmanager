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
          type: 'upload',
          access_mode: 'public', // Explicitly set to public
          invalidate: true, // Invalidate CDN cache
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(error);
          } else if (result) {
            // Override the secure_url with a truly public URL without authentication
            result.secure_url = this.getPublicFileUrl(result.public_id);
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
      resource_type: 'auto', // Handle PDFs, images, etc.
      type: 'upload',
      secure: true,
      sign_url: false, // Ensure no signing for public access
      auth_token: false, // Disable auth tokens
      version: false, // Don't include version number
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

  generateSignedUrl(publicId: string, options: { isDownload: boolean, filename: string, resourceType: string, format: string }): string {
    const cloudinary = this.cloudinaryConfig.getCloudinary();
    const { isDownload, filename, resourceType, format } = options;
    
    // The signing process uses the API Key and Secret from the server's environment.
    const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: 'upload',
      attachment: isDownload,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // URL is valid for 1 hour
    });

    // If it is a download, we need to append the filename ourselves for some browsers.
    if (isDownload) {
      try {
        const url = new URL(signedUrl);
        // A simple way to ensure the filename is part of the path for download prompts.
        // This doesn't affect the signature.
        url.pathname = `${url.pathname.substring(0, url.pathname.lastIndexOf('/'))}/${encodeURIComponent(filename)}`;
        return url.toString();
      } catch (e) {
        console.error("Error creating download URL, returning original signed URL", e);
        return signedUrl; // Fallback to the original signed URL
      }
    }
    
    return signedUrl;
  }
}
