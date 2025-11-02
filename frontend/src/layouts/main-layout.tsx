import type { ReactNode } from 'react';
import Navbar from '@/pages/home/_components/navbar';
import { HomeSidebar } from '@/pages/home/_components/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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
            <div className="container mx-auto px-4 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
