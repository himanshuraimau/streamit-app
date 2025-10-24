import { Link } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { useSignOut } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Search, User, LogOut, Menu, UserCircle, Settings, Video } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const session = authClient.useSession();
  const { signOut } = useSignOut();
  const { toggleSidebar } = useSidebar();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="flex h-20 items-center justify-between px-6 gap-6">
        {/* Left Section: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="size-10 text-white hover:bg-zinc-800"
          >
            <Menu className="size-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo_dark.svg" alt="StreamIt" className="h-9 w-auto" />
            <span className="text-xl font-bold text-white">StreamIt</span>
          </Link>
        </div>

        {/* Center Section: Search Bar */}
        <div className="hidden md:flex flex-1 justify-center px-8">
          <div className="relative w-full max-w-[500px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search streams..."
              className="w-full rounded-full bg-zinc-900 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-800 transition-all"
            />
          </div>
        </div>

        {/* Right Section: Auth */}
        <div className="flex items-center gap-3">
          {session.data ? (
            <>
              <Link to="/creator-application">
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden md:flex items-center gap-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-400 transition-all"
                >
                  <Video className="h-4 w-4" />
                  <span>Apply for Creator</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black">
                    {session.data.user.image ? (
                      <img
                        src={session.data.user.image}
                        alt={session.data.user.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.data.user.name}</p>
                      <p className="text-xs text-zinc-400">{session.data.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem className="text-zinc-300 focus:text-white focus:bg-zinc-800 cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-zinc-300 focus:text-white focus:bg-zinc-800 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-400 focus:text-red-300 focus:bg-zinc-800 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth/signin">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all"
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
