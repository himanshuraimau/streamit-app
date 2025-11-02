import { Link } from 'react-router-dom';

export function AuthNavbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo_dark.svg" alt="StreamIt" className="h-8 w-auto" />
        </Link>

        {/* Auth Links */}
        <div className="flex items-center gap-3">
          <Link
            to="/auth/signin"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/auth/signup"
            className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
