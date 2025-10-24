import { Radio, Users, TrendingUp } from 'lucide-react';

type TabType = 'live' | 'following' | 'trending';

interface HomeTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export function HomeTabs({ activeTab, onTabChange }: HomeTabsProps) {
    return (
        <div className="sticky z-40 w-full border-b border-zinc-800 bg-black/95 backdrop-blur flex justify-center">
            <div className="flex items-center gap-1 px-6">
                <button
                    onClick={() => onTabChange('live')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === 'live'
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    <Radio className="size-4" />
                    <span>Live Now</span>
                    {activeTab === 'live' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600" />
                    )}
                </button>

                <button
                    onClick={() => onTabChange('following')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === 'following'
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    <Users className="size-4" />
                    <span>Following</span>
                    {activeTab === 'following' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600" />
                    )}
                </button>

                <button
                    onClick={() => onTabChange('trending')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === 'trending'
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    <TrendingUp className="size-4" />
                    <span>Trending</span>
                    {activeTab === 'trending' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600" />
                    )}
                </button>
            </div>
        </div>
    );
}

export type { TabType };
