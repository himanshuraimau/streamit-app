import { prisma } from '../lib/db';
import { MediaService } from './media.service';
import { PostType, MediaType } from '@prisma/client';
import type {
    CreatePostInput,
    UpdatePostInput,
    PostResponse,
    PostFeedResponse,
    CreateCommentInput,
    CommentResponse,
    LikeResponse,
    MediaUploadInput,
    ProcessedMediaInput,
    FeedQuery
} from '../types/content';

export class ContentService {
    // Create a new post
    static async createPost(
        userId: string,
        data: CreatePostInput,
        mediaFiles?: Express.Multer.File[]
    ): Promise<PostResponse> {
        try {
            // Validate user is approved creator for media posts
            if (data.type !== PostType.TEXT) {
                await this.validateCreatorStatus(userId);
            }

            // Process media files if provided
            let processedMedia: ProcessedMediaInput[] = [];
            if (mediaFiles && mediaFiles.length > 0) {
                processedMedia = await this.processMediaFiles(mediaFiles);
            }

            // Determine post type based on content and media
            const postType = this.determinePostType(data.content, processedMedia);

            // Create post with media in a transaction
            const post = await prisma.$transaction(async (tx) => {
                // Create the post
                const newPost = await tx.post.create({
                    data: {
                        content: data.content,
                        type: postType,
                        isPublic: data.isPublic ?? true,
                        allowComments: data.allowComments ?? true,
                        authorId: userId,
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            }
                        },
                        media: true,
                    }
                });

                // Create media records if any
                if (processedMedia.length > 0) {
                    await tx.postMedia.createMany({
                        data: processedMedia.map(media => ({
                            postId: newPost.id,
                            url: media.url,
                            type: media.type,
                            mimeType: media.mimeType,
                            size: media.size,
                            width: media.width,
                            height: media.height,
                            duration: media.duration,
                            thumbnailUrl: media.thumbnailUrl,
                        }))
                    });

                    // Fetch the post with media
                    return tx.post.findUnique({
                        where: { id: newPost.id },
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    image: true,
                                }
                            },
                            media: true,
                        }
                    });
                }

                return newPost;
            });

            if (!post) {
                throw new Error('Failed to create post');
            }

            // Track file uploads
            if (processedMedia.length > 0) {
                await this.trackFileUploads(userId, processedMedia);
            }

            return this.formatPostResponse(post);
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    // Get user's posts
    static async getUserPosts(
        userId: string,
        query: FeedQuery,
        requestingUserId?: string
    ): Promise<PostFeedResponse> {
        const limit = query.limit || 20;
        const cursor = query.cursor;

        const posts = await prisma.post.findMany({
            where: {
                authorId: userId,
                ...(query.type && { type: query.type }),
                ...(query.isPublic !== undefined && { isPublic: query.isPublic }),
                ...(cursor && {
                    createdAt: {
                        lt: new Date(cursor)
                    }
                })
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                },
                ...(requestingUserId && {
                    likes: {
                        where: { userId: requestingUserId },
                        select: { id: true }
                    }
                })
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit + 1, // Take one extra to check if there are more
        });

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
        const lastPost = postsToReturn[postsToReturn.length - 1];
        const nextCursor = hasMore && lastPost ? lastPost.createdAt.toISOString() : undefined;

        return {
            posts: postsToReturn.map(post => this.formatPostResponse(post, requestingUserId)),
            hasMore,
            nextCursor
        };
    }

    // Get public feed
    static async getPublicFeed(
        query: FeedQuery,
        requestingUserId?: string
    ): Promise<PostFeedResponse> {
        const limit = query.limit || 20;
        const cursor = query.cursor;

        const posts = await prisma.post.findMany({
            where: {
                isPublic: true,
                ...(query.type && { type: query.type }),
                ...(cursor && {
                    createdAt: {
                        lt: new Date(cursor)
                    }
                })
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                },
                ...(requestingUserId && {
                    likes: {
                        where: { userId: requestingUserId },
                        select: { id: true }
                    }
                })
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit + 1,
        });

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
        const lastPost = postsToReturn[postsToReturn.length - 1];
        const nextCursor = hasMore && lastPost ? lastPost.createdAt.toISOString() : undefined;

        return {
            posts: postsToReturn.map(post => this.formatPostResponse(post, requestingUserId)),
            hasMore,
            nextCursor
        };
    }

    // Get single post
    static async getPost(postId: string, requestingUserId?: string): Promise<PostResponse | null> {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                },
                ...(requestingUserId && {
                    likes: {
                        where: { userId: requestingUserId },
                        select: { id: true }
                    }
                })
            }
        });

        if (!post) return null;

        return this.formatPostResponse(post, requestingUserId);
    }

    // Update post
    static async updatePost(
        postId: string,
        userId: string,
        data: UpdatePostInput
    ): Promise<PostResponse> {
        // Verify ownership
        const existingPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!existingPost || existingPost.authorId !== userId) {
            throw new Error('Post not found or access denied');
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            }
        });

        return this.formatPostResponse(updatedPost);
    }

    // Delete post
    static async deletePost(postId: string, userId: string): Promise<void> {
        // Verify ownership
        const existingPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!existingPost || existingPost.authorId !== userId) {
            throw new Error('Post not found or access denied');
        }

        await prisma.post.delete({
            where: { id: postId }
        });
    }

    // Like/unlike post
    static async togglePostLike(postId: string, userId: string): Promise<LikeResponse> {
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.$transaction([
                prisma.like.delete({
                    where: { id: existingLike.id }
                }),
                prisma.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: {
                            decrement: 1
                        }
                    }
                })
            ]);

            const post = await prisma.post.findUnique({
                where: { id: postId },
                select: { likesCount: true }
            });

            if (!post) {
                throw new Error('Post not found');
            }

            return {
                isLiked: false,
                likesCount: post.likesCount
            };
        } else {
            // Like
            await prisma.$transaction([
                prisma.like.create({
                    data: {
                        userId,
                        postId
                    }
                }),
                prisma.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: {
                            increment: 1
                        }
                    }
                })
            ]);

            const post = await prisma.post.findUnique({
                where: { id: postId },
                select: { likesCount: true }
            });

            if (!post) {
                throw new Error('Post not found');
            }

            return {
                isLiked: true,
                likesCount: post.likesCount
            };
        }
    }

    // Add comment
    static async addComment(userId: string, data: CreateCommentInput): Promise<CommentResponse> {
        const comment = await prisma.$transaction(async (tx) => {
            const newComment = await tx.comment.create({
                data: {
                    content: data.content,
                    userId,
                    postId: data.postId,
                    parentId: data.parentId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                        }
                    }
                }
            });

            // Increment comment count on post
            await tx.post.update({
                where: { id: data.postId },
                data: {
                    commentsCount: {
                        increment: 1
                    }
                }
            });

            return newComment;
        });

        return {
            id: comment.id,
            content: comment.content,
            likesCount: comment.likesCount,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user,
            isLiked: false
        };
    }

    // Get post comments
    static async getPostComments(
        postId: string,
        requestingUserId?: string
    ): Promise<CommentResponse[]> {
        const comments = await prisma.comment.findMany({
            where: {
                postId,
                parentId: null // Only top-level comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            }
                        },
                        ...(requestingUserId && {
                            likes: {
                                where: { userId: requestingUserId },
                                select: { id: true }
                            }
                        })
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                ...(requestingUserId && {
                    likes: {
                        where: { userId: requestingUserId },
                        select: { id: true }
                    }
                })
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            likesCount: comment.likesCount,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user,
            isLiked: requestingUserId ? comment.likes.length > 0 : false,
            replies: comment.replies.map(reply => ({
                id: reply.id,
                content: reply.content,
                likesCount: reply.likesCount,
                createdAt: reply.createdAt,
                updatedAt: reply.updatedAt,
                user: reply.user,
                isLiked: requestingUserId ? reply.likes.length > 0 : false,
            }))
        }));
    }

    // Helper methods
    private static async validateCreatorStatus(userId: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                creatorApplication: true
            }
        });

        if (!user?.creatorApplication || user.creatorApplication.status !== 'APPROVED') {
            throw new Error('Only approved creators can upload media content');
        }
    }

    private static async processMediaFiles(files: Express.Multer.File[]): Promise<ProcessedMediaInput[]> {
        const processedMedia: ProcessedMediaInput[] = [];

        for (const file of files) {
            // Determine media type from mime type
            const mediaType = this.getMediaTypeFromMimeType(file.mimetype);

            // Validate file
            const validation = MediaService.validateFile(file, mediaType);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // Process media
            const result = await MediaService.processMedia(file, mediaType);

            processedMedia.push({
                url: result.url,
                type: mediaType,
                mimeType: file.mimetype,
                size: file.size,
                width: result.width,
                height: result.height,
                duration: result.duration,
                thumbnailUrl: result.thumbnailUrl,
            });
        }

        return processedMedia;
    }

    private static getMediaTypeFromMimeType(mimeType: string): MediaType {
        if (mimeType.startsWith('image/')) {
            return mimeType === 'image/gif' ? MediaType.GIF : MediaType.IMAGE;
        } else if (mimeType.startsWith('video/')) {
            return MediaType.VIDEO;
        }
        throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    private static determinePostType(content?: string, media?: ProcessedMediaInput[]): PostType {
        const hasContent = content && content.trim().length > 0;
        const hasMedia = media && media.length > 0;

        if (hasContent && hasMedia) return PostType.MIXED;
        if (hasMedia) {
            const hasVideo = media.some(m => m.type === MediaType.VIDEO);
            return hasVideo ? PostType.VIDEO : PostType.IMAGE;
        }
        return PostType.TEXT;
    }

    private static async trackFileUploads(userId: string, media: ProcessedMediaInput[]): Promise<void> {
        try {
            await prisma.fileUpload.createMany({
                data: media.map(m => ({
                    fileName: m.url.split('/').pop() || 'unknown',
                    originalName: 'media-file',
                    mimeType: m.mimeType,
                    size: m.size,
                    url: m.url,
                    uploadedBy: userId,
                    purpose: 'POST_MEDIA',
                }))
            });
        } catch (error) {
            console.error('Error tracking file uploads:', error);
            // Don't throw error here as it's not critical for post creation
        }
    }

    private static formatPostResponse(post: any, requestingUserId?: string): PostResponse {
        return {
            id: post.id,
            content: post.content,
            type: post.type,
            isPublic: post.isPublic,
            allowComments: post.allowComments,
            likesCount: post._count?.likes || post.likesCount || 0,
            commentsCount: post._count?.comments || post.commentsCount || 0,
            viewsCount: post.viewsCount || 0,
            sharesCount: post.sharesCount || 0,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: post.author,
            media: post.media?.map((m: any) => ({
                id: m.id,
                url: m.url,
                type: m.type,
                mimeType: m.mimeType,
                size: m.size,
                width: m.width,
                height: m.height,
                duration: m.duration,
                thumbnailUrl: m.thumbnailUrl,
                createdAt: m.createdAt,
            })) || [],
            isLiked: requestingUserId ? (post.likes?.length > 0) : undefined,
        };
    }

    // NEW: Get trending content
    static async getTrendingContent(
        query: { page?: number; limit?: number; timeRange?: string },
        requestingUserId?: string
    ): Promise<PostFeedResponse> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const timeRange = query.timeRange || '7d';

        // Calculate date threshold based on timeRange
        const dateThreshold = this.getDateThreshold(timeRange);

        // Trending algorithm: weighted score
        // Formula: (likes * 1.0) + (comments * 2.0) + (views * 0.1) + (shares * 3.0) - (age_in_hours * 0.1)
        const posts = await prisma.$queryRaw<any[]>`
            SELECT 
                p.*,
                json_build_object(
                    'id', u.id,
                    'username', u.username,
                    'name', u.name,
                    'image', u.image
                ) as author,
                (
                    (p."likesCount" * 1.0) +
                    (p."commentsCount" * 2.0) +
                    (p."viewsCount" * 0.1) +
                    (p."sharesCount" * 3.0) +
                    (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600 * -0.1)
                ) as "trendingScore"
            FROM "post" p
            JOIN "user" u ON p."authorId" = u.id
            WHERE p."createdAt" >= ${dateThreshold}
                AND p."isPublic" = true
                AND p."isHidden" = false
            ORDER BY "trendingScore" DESC
            LIMIT ${limit}
            OFFSET ${(page - 1) * limit}
        `;

        // Get media for each post
        const postsWithMedia = await Promise.all(
            posts.map(async (post) => {
                const media = await prisma.postMedia.findMany({
                    where: { postId: post.id }
                });

                return {
                    ...post,
                    media,
                    _count: {
                        likes: post.likesCount,
                        comments: post.commentsCount
                    }
                };
            })
        );

        // Get total count for pagination
        const totalCount = await prisma.post.count({
            where: {
                createdAt: { gte: dateThreshold },
                isPublic: true,
                isHidden: false
            }
        });

        const hasMore = (page * limit) < totalCount;

        return {
            posts: postsWithMedia.map(post => this.formatPostResponse(post, requestingUserId)),
            hasMore,
            nextCursor: hasMore ? new Date(posts[posts.length - 1]?.createdAt).toISOString() : undefined
        };
    }

    // NEW: Track post view
    static async trackPostView(postId: string, userId?: string): Promise<void> {
        try {
            // Increment view count
            await prisma.post.update({
                where: { id: postId },
                data: {
                    viewsCount: {
                        increment: 1
                    }
                }
            });

            // Track individual view for analytics (optional)
            if (userId) {
                // Check if user already viewed this post recently (within last hour)
                const recentView = await prisma.postView.findFirst({
                    where: {
                        postId,
                        userId,
                        viewedAt: {
                            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                        }
                    }
                });

                // Only create new view record if no recent view exists
                if (!recentView) {
                    await prisma.postView.create({
                        data: {
                            postId,
                            userId
                        }
                    });
                }
            } else {
                // Track anonymous view
                await prisma.postView.create({
                    data: {
                        postId,
                        userId: null
                    }
                });
            }
        } catch (error) {
            console.error('Error tracking post view:', error);
            // Don't throw error as view tracking is not critical
        }
    }

    // NEW: Track post share
    static async trackPostShare(postId: string): Promise<void> {
        try {
            await prisma.post.update({
                where: { id: postId },
                data: {
                    sharesCount: {
                        increment: 1
                    }
                }
            });
        } catch (error) {
            console.error('Error tracking post share:', error);
            // Don't throw error as share tracking is not critical
        }
    }

    // Helper: Get date threshold based on time range
    private static getDateThreshold(timeRange: string): Date {
        const now = new Date();
        switch (timeRange) {
            case '24h':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    }

    // NEW: Get shorts from followed creators
    static async getFollowingShorts(
        userId: string,
        query: FeedQuery = {}
    ): Promise<PostFeedResponse> {
        try {
            // Get list of users the current user is following
            const following = await prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true }
            });

            const followingIds = following.map(f => f.followingId);

            if (followingIds.length === 0) {
                return {
                    posts: [],
                    hasMore: false
                };
            }

            const limit = query.limit || 20;
            const posts = await prisma.post.findMany({
                where: {
                    authorId: { in: followingIds },
                    type: 'VIDEO',
                    isShort: true,
                    isPublic: true,
                    isHidden: false
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            image: true
                        }
                    },
                    media: true,
                    _count: {
                        select: {
                            likes: true,
                            comments: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit + 1,
                ...(query.cursor && {
                    cursor: { id: query.cursor },
                    skip: 1
                })
            });

            const hasMore = posts.length > limit;
            const postsToReturn = hasMore ? posts.slice(0, -1) : posts;

            return {
                posts: postsToReturn.map(post => this.formatPostResponse(post, userId)),
                hasMore,
                nextCursor: hasMore ? postsToReturn[postsToReturn.length - 1]?.id : undefined
            };
        } catch (error) {
            console.error('Error fetching following shorts:', error);
            throw error;
        }
    }

    // NEW: Get trending shorts
    static async getTrendingShorts(
        query: { page?: number; limit?: number; timeRange?: string },
        requestingUserId?: string
    ): Promise<PostFeedResponse> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const timeRange = query.timeRange || '7d';

        const dateThreshold = this.getDateThreshold(timeRange);

        // Trending algorithm for shorts
        const posts = await prisma.$queryRaw<any[]>`
            SELECT 
                p.*,
                json_build_object(
                    'id', u.id,
                    'username', u.username,
                    'name', u.name,
                    'image', u.image
                ) as author,
                (
                    (p."likesCount" * 1.0) +
                    (p."commentsCount" * 2.0) +
                    (p."viewsCount" * 0.1) +
                    (p."sharesCount" * 3.0) +
                    (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600 * -0.1)
                ) as "trendingScore"
            FROM "post" p
            JOIN "user" u ON p."authorId" = u.id
            WHERE p."createdAt" >= ${dateThreshold}
                AND p."type" = 'VIDEO'
                AND p."isShort" = true
                AND p."isPublic" = true
                AND p."isHidden" = false
            ORDER BY "trendingScore" DESC
            LIMIT ${limit}
            OFFSET ${(page - 1) * limit}
        `;

        // Get media for each post
        const postsWithMedia = await Promise.all(
            posts.map(async (post) => {
                const media = await prisma.postMedia.findMany({
                    where: { postId: post.id }
                });

                return {
                    ...post,
                    media,
                    _count: {
                        likes: post.likesCount,
                        comments: post.commentsCount
                    }
                };
            })
        );

        const totalCount = await prisma.post.count({
            where: {
                createdAt: { gte: dateThreshold },
                type: 'VIDEO',
                isShort: true,
                isPublic: true,
                isHidden: false
            }
        });

        const hasMore = (page * limit) < totalCount;

        return {
            posts: postsWithMedia.map(post => this.formatPostResponse(post, requestingUserId)),
            hasMore,
            nextCursor: hasMore ? new Date(posts[posts.length - 1]?.createdAt).toISOString() : undefined
        };
    }

    // NEW: Get all public shorts (discover)
    static async getAllShorts(
        query: FeedQuery = {},
        requestingUserId?: string
    ): Promise<PostFeedResponse> {
        const limit = query.limit || 20;

        const posts = await prisma.post.findMany({
            where: {
                type: 'VIDEO',
                isShort: true,
                isPublic: true,
                isHidden: false
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(query.cursor && {
                cursor: { id: query.cursor },
                skip: 1
            })
        });

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, -1) : posts;

        return {
            posts: postsToReturn.map(post => this.formatPostResponse(post, requestingUserId)),
            hasMore,
            nextCursor: hasMore ? postsToReturn[postsToReturn.length - 1]?.id : undefined
        };
    }
}