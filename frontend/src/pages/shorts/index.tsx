import { useState } from 'react';
import { useFollowingShorts } from '@/hooks/useShorts';
import { ShortsPlayer } from '@/components/shorts/ShortsPlayer';
import { Loader2 } from 'lucide-react';

export default function ShortsPage() {
    const { data, fetchNextPage, hasNextPage, isLoading, error } = useFollowingShorts();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Flatten all pages into a single array
    const allShorts = data?.pages.flatMap(page => page.data?.posts || []) || [];

    const handleSwipeUp = () => {
        if (currentIndex < allShorts.length - 1) {
            setCurrentIndex(currentIndex + 1);

            // Prefetch next page when near the end
            if (currentIndex >= allShorts.length - 3 && hasNextPage) {
                fetchNextPage();
            }
        }
    };

    const handleSwipeDown = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (error) {
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
                    <p className="text-white/60 text-sm">Follow creators to see their shorts here</p>
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
