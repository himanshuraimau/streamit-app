import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!; 

// Generate unique file name
export const generateFileName = (originalName: string, purpose: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  
  // Create organized folder structure
  const folder = getFolderByPurpose(purpose);
  return `${folder}/${timestamp}-${randomString}-${baseName}${ext}`;
};

// Get folder based on file purpose
const getFolderByPurpose = (purpose: string): string => {
  switch (purpose) {
    case 'ID_DOCUMENT':
      return 'creator-applications/identity/documents';
    case 'SELFIE_PHOTO':
      return 'creator-applications/identity/selfies';
    case 'PROFILE_PICTURE':
      return 'creator-applications/profiles';
    case 'AVATAR':
      return 'avatars';
    case 'POST_MEDIA':
      return 'posts/media';
    case 'POST_IMAGE':
      return 'posts/images';
    case 'POST_VIDEO':
      return 'posts/videos';
    case 'POST_GIF':
      return 'posts/gifs';
    default:
      return 'misc';
  }
};

// Upload file to S3
export const uploadFileToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    // Set appropriate permissions
    ACL: 'private', // Files are private by default
  });

  await s3Client.send(command);
  
  // Return the S3 file URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
};

// Delete file from S3
export const deleteFileFromS3 = async (fileName: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  await s3Client.send(command);
};

// Generate presigned URL for secure file access
export const generatePresignedUrl = async (
  fileName: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

// Generate presigned URL for upload (for direct client uploads)
export const generatePresignedUploadUrl = async (
  fileName: string,
  mimeType: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<{ uploadUrl: string; fileUrl: string }> => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: mimeType,
    ACL: 'private',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

  return { uploadUrl, fileUrl };
};

// Extract file name from S3 URL
export const extractFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    throw new Error('Invalid S3 URL format');
  }
};

// Validate file type and size
export const validateFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { isValid: true };
};

// Get file info from S3 (optional utility)
export const getFileInfo = async (fileName: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const response = await s3Client.send(command);
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
    };
  } catch (error) {
    throw new Error('File not found in S3');
  }
};