import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PostResponse } from '@/types/content';
import { contentApi } from '@/lib/api/content';

interface ShortsPlayerProps {
    short: PostResponse;
    isActive: boolean;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

export function ShortsPlayer({ short, isActive, onSwipeUp, onSwipeDown }: ShortsPlayerProps) {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);

    // Auto-play when active
    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
        } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    // Track view when active
    useEffect(() => {
        if (isActive) {
            contentApi.trackView(short.id);
        }
    }, [isActive, short.id]);

    // Handle swipe gestures
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        touchEndY.current = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY.current;

        // Swipe up (next video)
        if (diff > 50 && onSwipeUp) {
            onSwipeUp();
        }
        // Swipe down (previous video)
        else if (diff < -50 && onSwipeDown) {
            onSwipeDown();
        }
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play().catch(console.error);
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    if (!short.media || short.media.length === 0) {
        return null;
    }

    return (
        <div
            className="relative h-screen w-screen bg-black"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Video */}
            <video
                ref={videoRef}
                src={short.media[0]?.url}
                className="absolute inset-0 w-full h-full object-contain"
                loop
                playsInline
                muted={isMuted}
                onClick={togglePlayPause}
            />

            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top: Creator info */}
                <div className="absolute top-4 left-4 right-4 flex items-center gap-3 pointer-events-auto">
                    <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => navigate(`/${short.author.username}`)}
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                            {short.author.image ? (
                                <img
                                    src={short.author.image}
                                    alt={short.author.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                                    {short.author.name[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-white text-sm">{short.author.name}</p>
                            <p className="text-xs text-white/80">@{short.author.username}</p>
                        </div>
                    </div>
                    <button className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full font-medium text-sm">
                        Follow
                    </button>
                </div>

                {/* Right: Action buttons */}
                <div className="absolute right-4 bottom-24 flex flex-col gap-6 pointer-events-auto">
                    <button className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">{short.likesCount || 0}</span>
                    </button>

                    <button className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">{short.commentsCount || 0}</span>
                    </button>

                    <button
                        className="flex flex-col items-center gap-1"
                        onClick={() => contentApi.trackShare(short.id)}
                    >
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition">
                            <Share2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">{short.sharesCount || 0}</span>
                    </button>

                    <button className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition">
                            <MoreVertical className="w-6 h-6 text-white" />
                        </div>
                    </button>

                    <button className="flex flex-col items-center gap-1" onClick={toggleMute}>
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition">
                            {isMuted ? (
                                <VolumeX className="w-6 h-6 text-white" />
                            ) : (
                                <Volume2 className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </button>
                </div>

                {/* Bottom: Caption */}
                {short.content && (
                    <div className="absolute bottom-4 left-4 right-20 pointer-events-auto">
                        <p className="text-white text-sm line-clamp-3 drop-shadow-lg">{short.content}</p>
                    </div>
                )}

                {/* Play/Pause indicator */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-2" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
