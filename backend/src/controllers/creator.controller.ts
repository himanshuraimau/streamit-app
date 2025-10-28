import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { 
  createApplicationSchema, 
  updateApplicationSchema, 
  saveDraftSchema,
  identityDraftSchema,
  financialDraftSchema,
  profileDraftSchema,
  fileUploadSchema
} from '../lib/validations/creator.validation';
import { 
  uploadFileToS3, 
  generateFileName, 
  deleteFileFromS3, 
  extractFileNameFromUrl,
  generatePresignedUrl
} from '../lib/s3';
import { ApplicationService } from '../services/application.service';

// Utility function to mask sensitive data
const maskSensitiveData = (application: any) => {
  if (application.financial) {
    application.financial.accountNumber = 
      '*'.repeat(application.financial.accountNumber.length - 4) + 
      application.financial.accountNumber.slice(-4);
    
    application.financial.panNumber = 
      application.financial.panNumber.slice(0, 2) + 
      '*'.repeat(6) + 
      application.financial.panNumber.slice(-2);
  }
  return application;
};

export class CreatorController {
  // Get current user's application
  static async getApplication(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      
      const application = await prisma.creatorApplication.findUnique({
        where: { userId },
        include: {
          identity: true,
          financial: true,
          profile: true,
        },
      });

      if (!application) {
        return res.status(404).json({ 
          success: false,
          error: 'Application not found' 
        });
      }

      // Mask sensitive financial data
      const maskedApplication = maskSensitiveData(application);

      res.json({
        success: true,
        data: maskedApplication
      });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  // Create new application
  static async createApplication(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = createApplicationSchema.parse(req.body);

      // Check if application already exists
      const existingApplication = await prisma.creatorApplication.findUnique({
        where: { userId },
      });

      if (existingApplication) {
        return res.status(400).json({ 
          success: false,
          error: 'Application already exists. Use update endpoint instead.' 
        });
      }

      // Validate that all files exist and belong to user
      await ApplicationService.validateApplicationFiles(userId, data);

      const application = await prisma.creatorApplication.create({
        data: {
          userId,
          status: 'PENDING',
          submittedAt: new Date(),
          identity: {
            create: {
              idType: data.identity.idType,
              idDocumentUrl: data.identity.idDocumentUrl,
              selfiePhotoUrl: data.identity.selfiePhotoUrl,
            },
          },
          financial: {
            create: {
              accountHolderName: data.financial.accountHolderName,
              accountNumber: data.financial.accountNumber,
              ifscCode: data.financial.ifscCode,
              panNumber: data.financial.panNumber,
            },
          },
          profile: {
            create: {
              profilePictureUrl: data.profile.profilePictureUrl,
              categories: data.profile.categories,
              bio: data.profile.bio,
            },
          },
        },
        include: {
          identity: true,
          financial: true,
          profile: true,
        },
      });

      // Mask sensitive data before sending response
      const maskedApplication = maskSensitiveData(application);

      res.status(201).json({
        success: true,
        data: maskedApplication,
        message: 'Application submitted successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error', 
          details: error.message
        });
      }
      console.error('Error creating application:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  // Update existing application (only if not approved)
  static async updateApplication(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = updateApplicationSchema.parse(req.body);

      // Check if application exists and can be updated
      const existingApplication = await prisma.creatorApplication.findUnique({
        where: { userId },
      });

      if (!existingApplication) {
        return res.status(404).json({ 
          success: false,
          error: 'Application not found' 
        });
      }

      if (existingApplication.status === 'APPROVED') {
        return res.status(400).json({ 
          success: false,
          error: 'Cannot update approved application' 
        });
      }

      // Validate that all files exist and belong to user
      await ApplicationService.validateApplicationFiles(userId, data);

      // Clean up old files before updating
      await ApplicationService.cleanupOldFiles(userId, data);

      // Build update data
      const updateData: any = {
        status: 'PENDING',
        submittedAt: new Date(),
      };

      if (data.identity) {
        updateData.identity = {
          upsert: {
            create: data.identity,
            update: data.identity,
          },
        };
      }

      if (data.financial) {
        updateData.financial = {
          upsert: {
            create: data.financial,
            update: data.financial,
          },
        };
      }

      if (data.profile) {
        updateData.profile = {
          upsert: {
            create: data.profile,
            update: data.profile,
          },
        };
      }

      const application = await prisma.creatorApplication.update({
        where: { userId },
        data: updateData,
        include: {
          identity: true,
          financial: true,
          profile: true,
        },
      });

      // Mask sensitive data before sending response
      const maskedApplication = maskSensitiveData(application);

      res.json({
        success: true,
        data: maskedApplication,
        message: 'Application updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error', 
          details: error.message
        });
      }
      console.error('Error updating application:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  // Check application status
  static async getApplicationStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      
      const application = await prisma.creatorApplication.findUnique({
        where: { userId },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!application) {
        return res.json({
          success: true,
          data: {
            hasApplication: false,
            status: null
          }
        });
      }

      res.json({
        success: true,
        data: {
          hasApplication: true,
          ...application
        }
      });
    } catch (error) {
      console.error('Error fetching application status:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  // Upload file to S3
  static async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded' 
        });
      }

      const userId = req.user!.id;
      const { purpose } = req.body;

      // Generate unique file name
      const fileName = generateFileName(req.file.originalname, purpose || 'OTHER');

      // Upload file to S3
      const fileUrl = await uploadFileToS3(
        req.file.buffer,
        fileName,
        req.file.mimetype
      );

      // Save file info to database
      const fileUpload = await prisma.fileUpload.create({
        data: {
          fileName,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          uploadedBy: userId,
          purpose: purpose || 'OTHER',
        },
      });

      res.json({
        success: true,
        data: {
          id: fileUpload.id,
          url: fileUpload.url,
          fileName: fileUpload.fileName,
          originalName: fileUpload.originalName,
          mimeType: fileUpload.mimeType,
          size: fileUpload.size,
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  // Generate presigned URL for secure file access
  static async getPresignedUrl(req: Request, res: Response) {
    try {
      const { fileUrl } = req.body;
      
      if (!fileUrl) {
        return res.status(400).json({
          success: false,
          error: 'File URL is required'
        });
      }

      // Extract file name from URL
      const fileName = extractFileNameFromUrl(fileUrl);
      
      // Generate presigned URL (valid for 1 hour)
      const presignedUrl = await generatePresignedUrl(fileName, 3600);

      res.json({
        success: true,
        data: {
          presignedUrl,
          expiresIn: 3600
        }
      });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Delete file from S3 (utility method)
  static async deleteFile(req: Request, res: Response) {
    try {
      const { fileUrl } = req.body;
      const userId = req.user!.id;

      if (!fileUrl) {
        return res.status(400).json({
          success: false,
          error: 'File URL is required'
        });
      }

      // Check if user owns the file
      const fileRecord = await prisma.fileUpload.findFirst({
        where: {
          url: fileUrl,
          uploadedBy: userId,
        },
      });

      if (!fileRecord) {
        return res.status(404).json({
          success: false,
          error: 'File not found or access denied'
        });
      }

      // Extract file name and delete from S3
      const fileName = extractFileNameFromUrl(fileUrl);
      await deleteFileFromS3(fileName);

      // Delete from database
      await prisma.fileUpload.delete({
        where: { id: fileRecord.id },
      });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get user file statistics
  static async getFileStats(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const stats = await ApplicationService.getUserFileStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching file stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}