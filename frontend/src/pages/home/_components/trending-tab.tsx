export function TrendingTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">Trending Creators</h2>
        <p className="text-lg text-zinc-400">
          Discover viral photos and shorts from creators across the platform
        </p>
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800">
          <span className="text-zinc-300 font-medium">Trending Feed Coming Soon</span>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-8 space-y-8">
        {/* Trending Photos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Trending Photos</h3>
            <span className="text-sm text-zinc-500">Based on engagement</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="group relative aspect-square rounded-lg bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-600 text-sm">Photo {i}</p>
                </div>
                {/* Engagement overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3 text-xs text-white">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                      1.2K
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      234
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Shorts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Trending Shorts</h3>
            <span className="text-sm text-zinc-500">Most viewed</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="group relative aspect-[9/16] rounded-lg bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-600 text-sm">Short {i}</p>
                </div>
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
                {/* View count */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-1 text-xs text-white">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {Math.floor(Math.random() * 100)}K
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction Options Info */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Interaction Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Like & Comment</p>
                <p className="text-xs">Engage with content you love</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Share</p>
                <p className="text-xs">Spread the word</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Follow Creators</p>
                <p className="text-xs">Discover new talent</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">View Profiles</p>
                <p className="text-xs">Learn more about creators</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
