export function FollowingTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">Following</h2>
        <p className="text-lg text-zinc-400">
          Photos, shorts, and exclusive content from creators you follow
        </p>
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800">
          <span className="text-zinc-300 font-medium">Content Feed Coming Soon</span>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-8 space-y-8">
        {/* Photos Section */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition-all duration-300"
              >
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-600 text-sm">Photo {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shorts Section */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Shorts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[9/16] rounded-lg bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition-all duration-300"
              >
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-600 text-sm">Short {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribed Content Section */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Subscribed Content
            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600">
              Premium
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-video rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition-all duration-300"
              >
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-600 text-sm">Exclusive Content {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
