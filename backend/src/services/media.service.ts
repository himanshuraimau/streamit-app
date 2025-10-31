import sharp from 'sharp';
import { uploadFileToS3, generateFileName } from '../lib/s3';
import { MediaType } from '@prisma/client';
import type { MediaProcessingResult, FileValidationResult } from '../types/content';

export class MediaService {
  // Process and upload image
  static async processImage(
    file: Express.Multer.File,
    purpose: string = 'POST_IMAGE'
  ): Promise<MediaProcessingResult> {
    try {
      // Get image metadata
      const metadata = await sharp(file.buffer).metadata();
      
      // Optimize image (resize if too large, compress)
      let processedBuffer = file.buffer;
      
      if (metadata.width && metadata.width > 2048) {
        processedBuffer = await sharp(file.buffer)
          .resize(2048, null, { 
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      
      // Generate unique filename
      const fileName = generateFileName(file.originalname, purpose);
      
      // Upload to S3
      const url = await uploadFileToS3(
        processedBuffer,
        fileName,
        file.mimetype
      );
      
      return {
        url,
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  // Process and upload video
  static async processVideo(
    file: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
    purpose: string = 'POST_VIDEO'
  ): Promise<MediaProcessingResult> {
    try {
      // Generate unique filename for video
      const videoFileName = generateFileName(file.originalname, purpose);
      
      // Upload video to S3
      const videoUrl = await uploadFileToS3(
        file.buffer,
        videoFileName,
        file.mimetype
      );
      
      let thumbnailUrl: string | undefined;
      
      // Process thumbnail if provided
      if (thumbnailFile) {
        const thumbnailResult = await this.processImage(thumbnailFile, 'POST_IMAGE');
        thumbnailUrl = thumbnailResult.url;
      }
      
      // For now, we'll return basic info
      // In a production app, you'd use FFmpeg to extract video metadata
      return {
        url: videoUrl,
        thumbnailUrl,
        // These would be extracted using FFmpeg in production
        width: undefined,
        height: undefined,
        duration: undefined
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error('Failed to process video');
    }
  }

  // Process GIF
  static async processGif(
    file: Express.Multer.File,
    purpose: string = 'POST_GIF'
  ): Promise<MediaProcessingResult> {
    try {
      // For GIFs, we'll just upload as-is for now
      // In production, you might want to optimize GIFs
      const fileName = generateFileName(file.originalname, purpose);
      
      const url = await uploadFileToS3(
        file.buffer,
        fileName,
        file.mimetype
      );
      
      // Get basic metadata using sharp (works for static GIFs)
      try {
        const metadata = await sharp(file.buffer).metadata();
        return {
          url,
          width: metadata.width,
          height: metadata.height
        };
      } catch {
        // If sharp fails (animated GIF), return without dimensions
        return { url };
      }
    } catch (error) {
      console.error('Error processing GIF:', error);
      throw new Error('Failed to process GIF');
    }
  }

  // Main processing method
  static async processMedia(
    file: Express.Multer.File,
    type: MediaType,
    thumbnailFile?: Express.Multer.File
  ): Promise<MediaProcessingResult> {
    switch (type) {
      case MediaType.IMAGE:
        return this.processImage(file);
      case MediaType.VIDEO:
        return this.processVideo(file, thumbnailFile);
      case MediaType.GIF:
        return this.processGif(file);
      default:
        throw new Error(`Unsupported media type: ${type}`);
    }
  }

  // Validate file before processing
  static validateFile(file: Express.Multer.File, type: MediaType): FileValidationResult {
    const allowedTypes = {
      [MediaType.IMAGE]: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      [MediaType.VIDEO]: ['video/mp4', 'video/webm', 'video/quicktime'],
      [MediaType.GIF]: ['image/gif']
    };

    const maxSizes = {
      [MediaType.IMAGE]: 10 * 1024 * 1024, // 10MB
      [MediaType.VIDEO]: 100 * 1024 * 1024, // 100MB
      [MediaType.GIF]: 20 * 1024 * 1024 // 20MB
    };

    // Check file type
    if (!allowedTypes[type].includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type for ${type}. Allowed types: ${allowedTypes[type].join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxSizes[type]) {
      return {
        isValid: false,
        error: `File too large. Maximum size for ${type}: ${maxSizes[type] / (1024 * 1024)}MB`
      };
    }

    return { isValid: true };
  }

  // Generate thumbnail for video (placeholder - would use FFmpeg in production)
  static async generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    // This is a placeholder implementation
    // In production, you'd use FFmpeg to extract a frame from the video
    // For now, we'll return a default thumbnail or throw an error
    throw new Error('Video thumbnail generation not implemented. Please provide a thumbnail file.');
  }

  // Get media metadata without processing
  static async getMediaMetadata(file: Express.Multer.File, type: MediaType): Promise<any> {
    try {
      switch (type) {
        case MediaType.IMAGE:
        case MediaType.GIF:
          const metadata = await sharp(file.buffer).metadata();
          return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format
          };
        case MediaType.VIDEO:
          // Would use FFmpeg in production
          return {
            // Placeholder values
            width: null,
            height: null,
            duration: null
          };
        default:
          return {};
      }
    } catch (error) {
      console.error('Error getting media metadata:', error);
      return {};
    }
  }
}