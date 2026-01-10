import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { contentApi } from '@/lib/api/content';
import type { PostResponse } from '@/types/content';

interface PostCardProps {
    post: PostResponse;
}

export function PostCard({ post }: PostCardProps) {
    const navigate = useNavigate();
    const cardRef = useRef<HTMLDivElement>(null);
    const viewTracked = useRef(false);

    // Track view when card becomes visible
    useEffect(() => {
        if (!cardRef.current || viewTracked.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !viewTracked.current) {
                        // Track view when 50% of the card is visible
                        contentApi.trackView(post.id);
                        viewTracked.current = true;
                        observer.disconnect();
                    }
                });
            },
            {
                threshold: 0.5, // Trigger when 50% visible
                rootMargin: '0px'
            }
        );

        observer.observe(cardRef.current);

        return () => {
            observer.disconnect();
        };
    }, [post.id]);

    return (
        <div ref={cardRef} className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
            {/* Media */}
            {post.media && post.media.length > 0 && (
                <div
                    className="aspect-video relative cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                >
                    {post.media[0].type === 'IMAGE' ? (
                        <img
                            src={post.media[0].url}
                            alt={post.content || 'Post image'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <video
                            src={post.media[0].url}
                            poster={post.media[0].thumbnailUrl || undefined}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Author */}
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/${post.author.username}`)}
                >
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                        {post.author.image ? (
                            <img
                                src={post.author.image}
                                alt={post.author.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-semibold">
                                {post.author.name[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{post.author.username}</p>
                    </div>
                </div>

                {/* Post Content */}
                {post.content && (
                    <p className="text-sm line-clamp-2">{post.content}</p>
                )}

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.commentsCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewsCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        <span>{post.sharesCount || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
