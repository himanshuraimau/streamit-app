import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAllShorts, useFollowingShorts } from '@/hooks/useShorts';
import { useSession } from '@/lib/auth-client';
import { ShortsPlayer } from '@/components/shorts/ShortsPlayer';
import { Loader2 } from 'lucide-react';

export default function ShortsPage() {
    const [searchParams] = useSearchParams();
    const selectedShortId = searchParams.get('short');
    const { data: session } = useSession();
    const followingShortsQuery = useFollowingShorts({ enabled: !!session?.user });
    const followingShorts = useMemo(
        () => followingShortsQuery.data?.pages.flatMap(page => page.data?.posts || []) || [],
        [followingShortsQuery.data]
    );
    const shouldLoadAllShorts = !session?.user || (followingShortsQuery.isFetched && followingShorts.length === 0);
    const allShortsQuery = useAllShorts({ enabled: shouldLoadAllShorts });
    const [currentIndex, setCurrentIndex] = useState(0);

    const allShorts = useMemo(() => {
        if (session?.user && followingShorts.length > 0) {
            return followingShorts;
        }

        return allShortsQuery.data?.pages.flatMap(page => page.data?.posts || []) || [];
    }, [allShortsQuery.data, followingShorts, session?.user]);

    const activeQuery =
        session?.user && followingShorts.length > 0 ? followingShortsQuery : allShortsQuery;

    useEffect(() => {
        if (!selectedShortId || allShorts.length === 0) {
            return;
        }

        const shortIndex = allShorts.findIndex((short) => short.id === selectedShortId);
        if (shortIndex >= 0) {
            setCurrentIndex(shortIndex);
        }
    }, [allShorts, selectedShortId]);

    const handleSwipeUp = () => {
        if (currentIndex < allShorts.length - 1) {
            setCurrentIndex(currentIndex + 1);

            // Prefetch next page when near the end
            if (currentIndex >= allShorts.length - 3 && activeQuery.hasNextPage) {
                activeQuery.fetchNextPage();
            }
        }
    };

    const handleSwipeDown = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    if (followingShortsQuery.isLoading || allShortsQuery.isLoading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (followingShortsQuery.isError && allShortsQuery.isError) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-lg mb-2">Failed to load shorts</p>
                    <p className="text-white/60 text-sm">Please try again later</p>
                </div>
            </div>
        );
    }

    if (allShorts.length === 0) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="text-center px-4">
                    <p className="text-white text-lg mb-2">No shorts available</p>
                    <p className="text-white/60 text-sm">
                        {session?.user
                            ? 'Follow creators or check back later for new shorts'
                            : 'Check back later for new shorts from creators'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black overflow-hidden">
            {allShorts.map((short, index) => (
                <div
                    key={short.id}
                    className={`absolute inset-0 transition-transform duration-300 ${index === currentIndex
                            ? 'translate-y-0'
                            : index < currentIndex
                                ? '-translate-y-full'
                                : 'translate-y-full'
                        }`}
                    style={{
                        zIndex: index === currentIndex ? 10 : index === currentIndex - 1 || index === currentIndex + 1 ? 5 : 0
                    }}
                >
                    <ShortsPlayer
                        short={short}
                        isActive={index === currentIndex}
                        onSwipeUp={handleSwipeUp}
                        onSwipeDown={handleSwipeDown}
                    />
                </div>
            ))}
        </div>
    );
}
