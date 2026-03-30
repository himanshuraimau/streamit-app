import { useLiveFollowedCreators } from '@/hooks/useLiveFollowedCreators';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function LiveCreatorIndicator() {
    const { data, isLoading, error } = useLiveFollowedCreators();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
        );
    }

    if (error) {
        return null; // Silently fail for better UX
    }

    if (!data?.creators || data.creators.length === 0) {
        return (
            <div className="py-8 text-center">
                <p className="text-sm text-zinc-400">No creators live right now</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div>
                <h2 className="text-lg font-semibold text-white">Followed creators live now</h2>
                <p className="text-sm text-zinc-400">Jump back into creators you already follow.</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {data.creators.map((creator) => (
                    <button
                        key={creator.id}
                        onClick={() => navigate(`/${creator.username}/live`)}
                        className="flex-shrink-0 group transition-transform hover:scale-105"
                    >
                        <div className="relative">
                            {/* Avatar with live ring */}
                            <div className="relative h-16 w-16 rounded-full border-2 border-red-500 ring-2 ring-red-500/20 p-0.5">
                                <img
                                    src={creator.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`}
                                    alt={creator.name}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            </div>

                            {/* Live badge */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                                <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                                    LIVE
                                </span>
                            </div>
                        </div>

                        {/* Creator name */}
                        <p className="mt-2 max-w-[64px] truncate text-center text-xs font-medium text-white">
                            {creator.name}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
