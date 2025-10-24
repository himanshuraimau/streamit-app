export function LiveNowTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <circle cx="10" cy="10" r="3" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">Watch Global Streamers</h2>
        <p className="text-lg text-zinc-400">
          Discover live streams from creators around the world
        </p>
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-3"></div>
          <span className="text-zinc-300 font-medium">Live Streams Coming Soon</span>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="group relative aspect-video rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-purple-500 transition-all duration-300"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <p className="text-zinc-600 font-medium text-sm">Stream {i}</p>
                </div>
              </div>
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
                  LIVE
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
