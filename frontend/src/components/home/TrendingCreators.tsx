import { useState } from 'react';
import { useTrending } from '@/hooks/useTrending';
import { PostCard } from '@/components/common/PostCard';

export function TrendingCreators() {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
    const { data, isLoading, error } = useTrending(timeRange);

    return (
        <div className="space-y-4">
            {/* Header with time range selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Trending Creators</h2>

                {/* Time range tabs */}
                <div className="flex gap-2 rounded-lg bg-muted p-1">
                    <button
                        onClick={() => setTimeRange('24h')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === '24h'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/50'
                            }`}
                    >
                        24h
                    </button>
                    <button
                        onClick={() => setTimeRange('7d')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === '7d'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/50'
                            }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setTimeRange('30d')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === '30d'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/50'
                            }`}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-video bg-muted rounded-lg" />
                            <div className="mt-2 h-4 bg-muted rounded w-3/4" />
                            <div className="mt-1 h-3 bg-muted rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Failed to load trending content</p>
                </div>
            ) : !data?.posts || data.posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No trending content available</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
