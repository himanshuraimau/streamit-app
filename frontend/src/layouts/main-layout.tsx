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

            {/* Footer */}
            <footer className="border-t border-zinc-800 mt-20">
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <img src="/logo_dark.svg" alt="StreamIt" className="h-8 w-auto" />
                    <span className="text-xl font-bold text-white">StreamIt</span>
                  </div>
                  <p className="text-zinc-500 text-sm">
                    © 2025 StreamIt. Your world of live streaming.
                  </p>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
