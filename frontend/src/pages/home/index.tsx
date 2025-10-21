import Navbar from './_components/navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6 max-w-4xl">
            <h1 className="text-6xl md:text-7xl font-bold text-white">
              Welcome to{' '}
              <span className="text-gradient-primary">
                StreamIt
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400">
              Your world of live streaming.
            </p>
            <p className="text-lg text-zinc-500">
              Stream. Watch. Connect.
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse mr-3"></div>
            <span className="text-zinc-300 font-medium">Live Streams Coming Soon</span>
          </div>

          {/* Placeholder Stream Grid */}
          <div className="w-full max-w-6xl mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Featured Streams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="group relative aspect-video rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-purple-500 transition-all duration-300"
                >
                  {/* Placeholder Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <p className="text-zinc-600 font-medium">Stream {i}</p>
                    </div>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center space-y-4">
            <p className="text-zinc-400">
              Ready to start streaming?
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signup"
                className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold transition-all duration-300 glow-primary"
              >
                Get Started
              </a>
              <a
                href="/auth/signin"
                className="px-8 py-3 rounded-full bg-zinc-900 border border-zinc-700 hover:border-purple-500 text-white font-semibold transition-all duration-300"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <img src="/logo_dark.svg" alt="StreamIt" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white">StreamIt</span>
            </div>
            <p className="text-zinc-500 text-sm">
              © 2024 StreamIt. Your world of live streaming.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
