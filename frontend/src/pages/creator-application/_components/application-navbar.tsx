import { Link } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { useSignOut } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { User, LogOut, Home } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ApplicationNavbar() {
  const { data: session } = authClient.useSession();
  const { signOut } = useSignOut();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="flex h-20 items-center justify-between px-6 gap-6">
        {/* Left Section: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_dark.svg" alt="StreamIt" className="h-9 w-auto" />
          <span className="text-xl font-bold text-white">StreamIt</span>
        </Link>

        {/* Center Section: Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-white">Creator Application</h1>
        </div>

        {/* Right Section: User Menu */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link to="/">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name}
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
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-zinc-400">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
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
            <Link to="/auth/signin">
              <Button
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
