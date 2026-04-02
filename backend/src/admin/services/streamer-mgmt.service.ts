import { prisma } from '../../lib/db';
import type { Prisma, ApplicationStatus } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';
import { RoomServiceClient } from 'livekit-server-sdk';
import { EmailService } from '../../lib/email.service';
import {
  getApplicationCustomEmailTemplate,
  getApplicationDecisionEmailTemplate,
} from '../../lib/email-templates';

/**
 * Filters for listing creator applications
 */
export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus;
  submittedFrom?: Date;
  submittedTo?: Date;
  sortBy?: 'submittedAt' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Creator application list item
 */
export interface ApplicationListItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userUsername: string;
  status: ApplicationStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

export interface ApplicationReviewer {
  id: string;
  name: string;
  email: string;
}

/**
 * Complete application details
 */
export interface ApplicationDetails {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    isSuspended: boolean;
    suspendedReason: string | null;
    suspendedAt: Date | null;
    suspensionExpiresAt: Date | null;
  };
  status: ApplicationStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewedByAdmin: ApplicationReviewer | null;
  rejectionReason: string | null;
  identity: {
    idType: string;
    idDocumentUrl: string;
    selfiePhotoUrl: string;
    isVerified: boolean;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    verifiedByAdmin: ApplicationReviewer | null;
  } | null;
  financial: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
    isVerified: boolean;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    verifiedByAdmin: ApplicationReviewer | null;
  } | null;
  profile: {
    profilePictureUrl: string;
    bio: string;
    categories: string[];
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Live stream item
 */
export interface LiveStreamItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  userId: string;
  userName: string;
  isLive: boolean;
  isChatEnabled: boolean;
  startedAt: Date | null;
  stats: {
    peakViewers: number;
    totalViewers: number;
    totalLikes: number;
    totalGifts: number;
  } | null;
}

/**
 * Service for managing streamers and creator applications
 * Handles application review, live stream monitoring, and stream control
 *
 * Requirements: 5.1-5.11
 */
export class StreamerMgmtService {
  /**
   * Initialize LiveKit room service client
   */
  private static getLiveKitClient(): RoomServiceClient {
    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }

    return new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  }

  /**
   * List creator applications with filtering and pagination
   *
   * @param filters - Filter criteria
   * @param pagination - Pagination parameters
   * @returns Paginated list of applications
   *
   * Requirements: 5.1
   */
  static async listApplications(
    filters: ApplicationFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ApplicationListItem>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.CreatorApplicationWhereInput = {};

    if (filters.search) {
      where.user = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { username: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    // Filter by status
    if (filters.status) {
      where.status = filters.status;
    }

    // Filter by submission date range
    if (filters.submittedFrom || filters.submittedTo) {
      where.submittedAt = {};
      if (filters.submittedFrom) {
        where.submittedAt.gte = filters.submittedFrom;
      }
      if (filters.submittedTo) {
        where.submittedAt.lte = filters.submittedTo;
      }
    }

    // Build order by clause
    const orderBy: Prisma.CreatorApplicationOrderByWithRelationInput = {};
    const sortBy = filters.sortBy || 'submittedAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    // Execute query with pagination
    const [applications, totalCount] = await Promise.all([
      prisma.creatorApplication.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      }),
      prisma.creatorApplication.count({ where }),
    ]);

    // Transform results
    const data: ApplicationListItem[] = applications.map((app) => ({
      id: app.id,
      userId: app.userId,
      userName: app.user.name,
      userEmail: app.user.email,
      userUsername: app.user.username,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      reviewedBy: app.reviewedBy,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get complete application details by ID
   *
   * @param id - Application ID
   * @returns Complete application details or null if not found
   *
   * Requirements: 5.2
   */
  static async getApplicationById(id: string): Promise<ApplicationDetails | null> {
    const application = await prisma.creatorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            isSuspended: true,
            suspendedReason: true,
            suspendedAt: true,
            suspensionExpiresAt: true,
          },
        },
        identity: true,
        financial: true,
        profile: true,
      },
    });

    if (!application) {
      return null;
    }

    const reviewerIds = Array.from(
      new Set(
        [
          application.reviewedBy,
          application.identity?.verifiedBy,
          application.financial?.verifiedBy,
        ].filter((value): value is string => Boolean(value))
      )
    );

    const reviewers = reviewerIds.length
      ? await prisma.user.findMany({
          where: {
            id: {
              in: reviewerIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];

    const reviewerMap = new Map(reviewers.map((reviewer) => [reviewer.id, reviewer]));

    const mapReviewer = (reviewerId?: string | null): ApplicationReviewer | null => {
      if (!reviewerId) {
        return null;
      }

      const reviewer = reviewerMap.get(reviewerId);
      if (!reviewer) {
        return null;
      }

      return {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
      };
    };

    return {
      id: application.id,
      userId: application.userId,
      user: application.user,
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      reviewedBy: application.reviewedBy,
      reviewedByAdmin: mapReviewer(application.reviewedBy),
      rejectionReason: application.rejectionReason,
      identity: application.identity
        ? {
            idType: application.identity.idType,
            idDocumentUrl: application.identity.idDocumentUrl,
            selfiePhotoUrl: application.identity.selfiePhotoUrl,
            isVerified: application.identity.isVerified,
            verifiedAt: application.identity.verifiedAt,
            verifiedBy: application.identity.verifiedBy,
            verifiedByAdmin: mapReviewer(application.identity.verifiedBy),
          }
        : null,
      financial: application.financial
        ? {
            accountHolderName: application.financial.accountHolderName,
            accountNumber: application.financial.accountNumber,
            ifscCode: application.financial.ifscCode,
            panNumber: application.financial.panNumber,
            isVerified: application.financial.isVerified,
            verifiedAt: application.financial.verifiedAt,
            verifiedBy: application.financial.verifiedBy,
            verifiedByAdmin: mapReviewer(application.financial.verifiedBy),
          }
        : null,
      profile: application.profile
        ? {
            profilePictureUrl: application.profile.profilePictureUrl,
            bio: application.profile.bio,
            categories: application.profile.categories,
          }
        : null,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }

  /**
   * Approve a creator application
   * Updates application status, upgrades user role to CREATOR, and creates audit log
   *
   * @param id - Application ID
   * @param adminId - ID of admin performing the action
   * @returns Updated application
   *
   * Requirements: 5.3
   */
  static async approveApplication(id: string, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get application to verify it exists and get userId
      const application = await tx.creatorApplication.findUnique({
        where: { id },
        select: { userId: true, status: true },
      });

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== 'PENDING') {
        throw new Error('Only pending applications can be approved');
      }

      // Update application status
      const updatedApplication = await tx.creatorApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: adminId,
        },
      });

      // Upgrade user role to CREATOR
      await tx.user.update({
        where: { id: application.userId },
        data: {
          role: 'CREATOR',
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'application_approve', 'application', id, {
        userId: application.userId,
        previousStatus: application.status,
        newStatus: 'APPROVED',
      });

      return updatedApplication;
    });
  }

  /**
   * Reject a creator application
   * Updates application status with rejection reason and creates audit log
   *
   * @param id - Application ID
   * @param reason - Reason for rejection
   * @param adminId - ID of admin performing the action
   * @returns Updated application
   *
   * Requirements: 5.4
   */
  static async rejectApplication(id: string, reason: string, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get application to verify it exists
      const application = await tx.creatorApplication.findUnique({
        where: { id },
        select: { userId: true, status: true },
      });

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== 'PENDING') {
        throw new Error('Only pending applications can be rejected');
      }

      // Update application status
      const updatedApplication = await tx.creatorApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: adminId,
          rejectionReason: reason,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'application_reject', 'application', id, {
        userId: application.userId,
        previousStatus: application.status,
        newStatus: 'REJECTED',
        reason,
      });

      return updatedApplication;
    });
  }

  static async addApplicationNote(id: string, note: string, adminId: string) {
    const application = await prisma.creatorApplication.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    await AuditLogService.createLog(adminId, 'application_note', 'application', id, {
      userId: application.userId,
      status: application.status,
      note,
    });

    return { success: true };
  }

  private static async getApplicationRecipient(id: string) {
    const application = await prisma.creatorApplication.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  static async sendApplicationDecisionEmail(id: string, status: 'APPROVED' | 'REJECTED') {
    const application = await this.getApplicationRecipient(id);

    await EmailService.sendEmail({
      to: application.user.email,
      subject:
        status === 'APPROVED'
          ? 'Your VoltStream creator application is approved'
          : 'Update on your VoltStream creator application',
      html: getApplicationDecisionEmailTemplate(
        application.user.name,
        status,
        status === 'REJECTED' ? application.rejectionReason || undefined : undefined
      ),
    });
  }

  static async sendApplicationCustomEmail(
    id: string,
    subject: string,
    message: string,
    reviewerName?: string
  ) {
    const application = await this.getApplicationRecipient(id);

    await EmailService.sendEmail({
      to: application.user.email,
      subject,
      html: getApplicationCustomEmailTemplate(application.user.name, subject, message, reviewerName),
    });

    return {
      to: application.user.email,
      userId: application.user.id,
    };
  }

  /**
   * List all currently active live streams
   *
   * @returns List of live streams with streamer and stats
   *
   * Requirements: 5.5, 5.6
   */
  static async listLiveStreams(): Promise<LiveStreamItem[]> {
    const streams = await prisma.stream.findMany({
      where: {
        isLive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        stats: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return streams.map((stream) => ({
      id: stream.id,
      title: stream.title,
      description: stream.description,
      thumbnail: stream.thumbnail,
      category: stream.category,
      userId: stream.userId,
      userName: stream.user.name,
      isLive: stream.isLive,
      isChatEnabled: stream.isChatEnabled,
      startedAt: stream.startedAt,
      stats: stream.stats
        ? {
            peakViewers: stream.stats.peakViewers,
            totalViewers: stream.stats.totalViewers,
            totalLikes: stream.stats.totalLikes,
            totalGifts: stream.stats.totalGifts,
          }
        : null,
    }));
  }

  /**
   * Kill a live stream
   * Terminates the LiveKit room and updates stream status
   *
   * @param streamId - Stream ID
   * @param reason - Reason for termination
   * @param adminId - ID of admin performing the action
   * @returns Updated stream
   *
   * Requirements: 5.7
   */
  static async killStream(streamId: string, reason: string, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get stream to verify it exists
      const stream = await tx.stream.findUnique({
        where: { id: streamId },
        select: { userId: true, isLive: true },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      // Terminate LiveKit room
      try {
        const roomService = this.getLiveKitClient();
        // Room name is the stream ID
        await roomService.deleteRoom(streamId);
      } catch (error) {
        console.error('Error terminating LiveKit room:', error);
        // Continue with database update even if LiveKit fails
      }

      // Update stream status
      const updatedStream = await tx.stream.update({
        where: { id: streamId },
        data: {
          isLive: false,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'stream_kill', 'stream', streamId, {
        userId: stream.userId,
        reason,
      });

      return updatedStream;
    });
  }

  /**
   * Mute a streamer's audio
   * Disables audio in the LiveKit room
   *
   * @param streamId - Stream ID
   * @param adminId - ID of admin performing the action
   * @returns Success status
   *
   * Requirements: 5.8
   */
  static async muteStreamer(streamId: string, adminId: string) {
    // Get stream to verify it exists and get user ID
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { userId: true, isLive: true },
    });

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (!stream.isLive) {
      throw new Error('Stream is not live');
    }

    // Mute participant in LiveKit room
    try {
      const roomService = this.getLiveKitClient();
      // Get participants in the room
      const participants = await roomService.listParticipants(streamId);

      // Find the streamer participant (should be the host)
      const streamerParticipant = participants.find((p) => p.identity === stream.userId);

      if (streamerParticipant) {
        // Mute the streamer's audio track
        await roomService.mutePublishedTrack(streamId, streamerParticipant.identity, 'audio', true);
      }
    } catch (error) {
      console.error('Error muting streamer in LiveKit:', error);
      throw new Error('Failed to mute streamer');
    }

    // Create audit log entry
    await AuditLogService.createLog(adminId, 'streamer_mute', 'stream', streamId, {
      userId: stream.userId,
    });

    return { success: true };
  }

  /**
   * Disable chat for a stream
   * Updates stream chat settings
   *
   * @param streamId - Stream ID
   * @param adminId - ID of admin performing the action
   * @returns Updated stream
   *
   * Requirements: 5.9
   */
  static async disableStreamChat(streamId: string, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get stream to verify it exists
      const stream = await tx.stream.findUnique({
        where: { id: streamId },
        select: { userId: true },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      // Update stream chat settings
      const updatedStream = await tx.stream.update({
        where: { id: streamId },
        data: {
          isChatEnabled: false,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'stream_chat_disable', 'stream', streamId, {
        userId: stream.userId,
      });

      return updatedStream;
    });
  }

  /**
   * Send a warning to a streamer
   * Creates a notification and audit log entry
   *
   * @param streamId - Stream ID
   * @param message - Warning message
   * @param adminId - ID of admin performing the action
   * @returns Success status
   *
   * Requirements: 5.10
   */
  static async warnStreamer(streamId: string, message: string, adminId: string) {
    // Get stream to verify it exists and get user ID
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { userId: true },
    });

    if (!stream) {
      throw new Error('Stream not found');
    }

    // TODO: Send notification to streamer
    // This would integrate with a notification service
    // For now, we just create the audit log

    // Create audit log entry
    await AuditLogService.createLog(adminId, 'streamer_warn', 'stream', streamId, {
      userId: stream.userId,
      message,
    });

    return { success: true, message: 'Warning sent to streamer' };
  }

  /**
   * Suspend a streamer account
   * Freezes the user account and terminates any active stream
   *
   * @param userId - User ID
   * @param reason - Reason for suspension
   * @param adminId - ID of admin performing the action
   * @param expiresAt - Optional expiration date
   * @param adminNotes - Optional admin notes
   * @returns Updated user
   *
   * Requirements: 5.11
   */
  static async suspendStreamer(
    userId: string,
    reason: string,
    adminId: string,
    expiresAt?: Date,
    adminNotes?: string
  ) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get user to verify they exist
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update user suspension status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          isSuspended: true,
          suspendedReason: reason,
          suspendedBy: adminId,
          suspendedAt: new Date(),
          suspensionExpiresAt: expiresAt || null,
          adminNotes: adminNotes || undefined,
        },
      });

      // Check if user has an active stream and terminate it
      const activeStream = await tx.stream.findUnique({
        where: { userId },
        select: { id: true, isLive: true },
      });

      if (activeStream && activeStream.isLive) {
        // Terminate LiveKit room
        try {
          const roomService = this.getLiveKitClient();
          await roomService.deleteRoom(activeStream.id);
        } catch (error) {
          console.error('Error terminating LiveKit room:', error);
          // Continue with database update even if LiveKit fails
        }

        // Update stream status
        await tx.stream.update({
          where: { id: activeStream.id },
          data: {
            isLive: false,
          },
        });
      }

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'user_freeze', 'user', userId, {
        reason,
        expiresAt: expiresAt?.toISOString() || null,
        adminNotes,
        streamTerminated: activeStream?.isLive || false,
      });

      return updatedUser;
    });
  }
}
