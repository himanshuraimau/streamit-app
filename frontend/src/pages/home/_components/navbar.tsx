import { Link } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { useSignOut } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Search, User, LogOut, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export default function Navbar() {
  const session = authClient.useSession();
  const { signOut } = useSignOut();
  const { toggleSidebar } = useSidebar();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="flex h-16 items-center px-4">
        {/* Hamburger Menu + Logo */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="size-9 text-white hover:bg-zinc-800"
          >
            <Menu className="size-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo_dark.svg" alt="StreamIt" className="h-8 w-auto" />
            <span className="text-xl font-bold text-white">StreamIt</span>
          </Link>
        </div>

        {/* Search Bar (Placeholder) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search streams..."
              className="w-full rounded-full bg-zinc-900 py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-800"
            />
          </div>
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-4">
          {session.data ? (
            <>
              <div className="hidden md:flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600">
                  {session.data.user.image ? (
                    <img
                      src={session.data.user.image}
                      alt={session.data.user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="text-sm text-white">{session.data.user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/signin">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
