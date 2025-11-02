import { useState } from 'react';
import Navbar from './_components/navbar';
import { HomeSidebar } from './_components/sidebar';
import { HomeTabs, type TabType } from './_components/home-tabs';
import { LiveNowTab } from './_components/live-now-tab';
import { FollowingTab } from './_components/following-tab';
import { TrendingTab } from './_components/trending-tab';
import { PostsTab } from './_components/posts-tab';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('live');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'live':
        return <LiveNowTab />;
      case 'following':
        return <FollowingTab />;
      case 'trending':
        return <TrendingTab />;
      case 'posts':
        return <PostsTab />;
      default:
        return <LiveNowTab />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-black">
        {/* Full-width navbar at the top */}
        <Navbar />

        {/* Sidebar and main content below navbar */}
        <div className="flex flex-1 pt-20">
          <HomeSidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Tabs below navbar */}
            <HomeTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="container mx-auto px-4 py-12">
              {/* Tab Content */}
              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
