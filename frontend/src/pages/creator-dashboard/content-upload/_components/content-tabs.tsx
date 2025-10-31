import { useSession } from '@/lib/auth-client';

export type ContentTabType = 'feed' | 'my-posts';

interface ContentTabsProps {
  activeTab: ContentTabType;
  onTabChange: (tab: ContentTabType) => void;
}

export function ContentTabs({ activeTab, onTabChange }: ContentTabsProps) {
  const { data: session } = useSession();

  const tabs = [
    { id: 'feed' as const, label: 'Feed', public: true },
    { id: 'my-posts' as const, label: 'My Posts', public: false },
  ];

  const visibleTabs = tabs.filter(tab => tab.public || session?.user);

  return (
    <div className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-20 z-40">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}