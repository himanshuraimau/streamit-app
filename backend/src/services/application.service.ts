import { prisma } from '../lib/db';
import { deleteFileFromS3, extractFileNameFromUrl } from '../lib/s3';
import type { CreateApplicationInput, UpdateApplicationInput } from '../lib/validations/creator.validation';

export class ApplicationService {
  // Clean up old files when updating application
  static async cleanupOldFiles(userId: string, newData: UpdateApplicationInput) {
    try {
      const existingApplication = await prisma.creatorApplication.findUnique({
        where: { userId },
        include: {
          identity: true,
          profile: true,
        },
      });

      if (!existingApplication) return;

      const filesToDelete: string[] = [];

      // Check identity files
      if (newData.identity && existingApplication.identity) {
        if (newData.identity.idDocumentUrl !== existingApplication.identity.idDocumentUrl) {
          filesToDelete.push(existingApplication.identity.idDocumentUrl);
        }
        if (newData.identity.selfiePhotoUrl !== existingApplication.identity.selfiePhotoUrl) {
          filesToDelete.push(existingApplication.identity.selfiePhotoUrl);
        }
      }

      // Check profile files
      if (newData.profile && existingApplication.profile) {
        if (newData.profile.profilePictureUrl !== existingApplication.profile.profilePictureUrl) {
          filesToDelete.push(existingApplication.profile.profilePictureUrl);
        }
      }

      // Delete old files from S3 and database
      for (const fileUrl of filesToDelete) {
        try {
          const fileName = extractFileNameFromUrl(fileUrl);
          await deleteFileFromS3(fileName);
          
          // Remove from file uploads table
          await prisma.fileUpload.deleteMany({
            where: { url: fileUrl },
          });
        } catch (error) {
          console.error(`Failed to delete file ${fileUrl}:`, error);
          // Continue with other files even if one fails
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      // Don't throw error as this is cleanup operation
    }
  }

  // Validate that all required files exist and belong to user
  static async validateApplicationFiles(userId: string, data: CreateApplicationInput | UpdateApplicationInput) {
    const fileUrls: string[] = [];

    if (data.identity) {
      fileUrls.push(data.identity.idDocumentUrl, data.identity.selfiePhotoUrl);
    }

    if (data.profile) {
      fileUrls.push(data.profile.profilePictureUrl);
    }

    // Check if all files exist and belong to the user
    for (const fileUrl of fileUrls) {
      const fileRecord = await prisma.fileUpload.findFirst({
        where: {
          url: fileUrl,
          uploadedBy: userId,
        },
      });

      if (!fileRecord) {
        throw new Error(`File not found or access denied: ${fileUrl}`);
      }
    }

    return true;
  }

  // Get application with presigned URLs for secure file access
  static async getApplicationWithPresignedUrls(userId: string) {
    const application = await prisma.creatorApplication.findUnique({
      where: { userId },
      include: {
        identity: true,
        financial: true,
        profile: true,
      },
    });

    if (!application) {
      return null;
    }

    // Note: In a real implementation, you might want to generate presigned URLs here
    // For now, we'll return the application as-is since the frontend will request
    // presigned URLs when needed for display

    return application;
  }

  // Delete all files associated with an application
  static async deleteApplicationFiles(userId: string) {
    try {
      const application = await prisma.creatorApplication.findUnique({
        where: { userId },
        include: {
          identity: true,
          profile: true,
        },
      });

      if (!application) return;

      const fileUrls: string[] = [];

      if (application.identity) {
        fileUrls.push(
          application.identity.idDocumentUrl,
          application.identity.selfiePhotoUrl
        );
      }

      if (application.profile) {
        fileUrls.push(application.profile.profilePictureUrl);
      }

      // Delete files from S3 and database
      for (const fileUrl of fileUrls) {
        try {
          const fileName = extractFileNameFromUrl(fileUrl);
          await deleteFileFromS3(fileName);
          
          await prisma.fileUpload.deleteMany({
            where: { url: fileUrl },
          });
        } catch (error) {
          console.error(`Failed to delete file ${fileUrl}:`, error);
        }
      }
    } catch (error) {
      console.error('Error deleting application files:', error);
    }
  }

  // Get file usage statistics for user
  static async getUserFileStats(userId: string) {
    const stats = await prisma.fileUpload.aggregate({
      where: { uploadedBy: userId },
      _sum: { size: true },
      _count: { id: true },
    });

    return {
      totalFiles: stats._count.id || 0,
      totalSize: stats._sum.size || 0,
      totalSizeMB: Math.round((stats._sum.size || 0) / (1024 * 1024) * 100) / 100,
    };
  }
}