import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, SearchX } from 'lucide-react';
import Navbar from '@/pages/home/_components/navbar';
import { HomeSidebar } from '@/pages/home/_components/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { StreamResultCard } from './_components/stream-result-card';
import { UserResultCard } from './_components/user-result-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { searchApi, type SearchResults } from '@/lib/api/search';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'all') as 'all' | 'streams' | 'users';
  const live = searchParams.get('live');
  const sort = (searchParams.get('sort') || 'relevance') as 'relevance' | 'viewers' | 'recent';

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError(null);

      const response = await searchApi.search({
        q: query,
        type,
        live: live === 'true' ? true : undefined,
        sort,
        limit: 20,
      });

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error || 'Search failed');
      }

      setLoading(false);
    };

    performSearch();
  }, [query, type, live, sort]);

  const handleTabChange = (newType: string) => {
    const params = new URLSearchParams(searchParams);
    if (newType === 'all') {
      params.delete('type');
    } else {
      params.set('type', newType);
    }
    setSearchParams(params);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    setSearchParams(params);
  };

  const toggleLiveFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (live === 'true') {
      params.delete('live');
    } else {
      params.set('live', 'true');
    }
    setSearchParams(params);
  };

  const totalResults = results ? results.total.streams + results.total.users : 0;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 pt-20">
          <HomeSidebar />

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {!query ? (
                // Empty State - No Search Query
                <div className="flex flex-col items-center justify-center py-20">
                  <SearchX className="w-20 h-20 text-zinc-600 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Start Searching</h2>
                  <p className="text-zinc-400 text-center max-w-md">
                    Search for live streams, creators, or categories to discover amazing content
                  </p>
                </div>
              ) : loading ? (
                // Loading State
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                </div>
              ) : error ? (
                // Error State
                <div className="flex flex-col items-center justify-center py-20">
                  <SearchX className="w-20 h-20 text-red-500 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Search Failed</h2>
                  <p className="text-zinc-400">{error}</p>
                </div>
              ) : results && totalResults === 0 ? (
                // No Results
                <div className="flex flex-col items-center justify-center py-20">
                  <SearchX className="w-20 h-20 text-zinc-600 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">No Results Found</h2>
                  <p className="text-zinc-400 text-center max-w-md">
                    No results for "<span className="text-white font-semibold">{query}</span>". Try different keywords or browse categories.
                  </p>
                </div>
              ) : results ? (
                // Search Results
                <div>
                  {/* Header with Filters */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">
                        Search Results for "{query}"
                      </h1>
                      <p className="text-zinc-400">{totalResults.toLocaleString()} results found</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Live Filter */}
                      {type !== 'users' && (
                        <Button
                          variant={live === 'true' ? 'default' : 'outline'}
                          size="sm"
                          onClick={toggleLiveFilter}
                          className={live === 'true' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 hover:bg-zinc-800'}
                        >
                          {live === 'true' ? '🔴 Live' : 'Show Live Only'}
                        </Button>
                      )}

                      {/* Sort Dropdown */}
                      {type !== 'users' && (
                        <select
                          value={sort}
                          onChange={(e) => handleSortChange(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm hover:bg-zinc-800 transition-colors"
                        >
                          <option value="relevance">Most Relevant</option>
                          <option value="viewers">Most Viewers</option>
                          <option value="recent">Most Recent</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs value={type} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-zinc-900 border-b border-zinc-800 w-full justify-start rounded-none h-12 p-0">
                      <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
                        All ({totalResults})
                      </TabsTrigger>
                      <TabsTrigger value="streams" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
                        Streams ({results.total.streams})
                      </TabsTrigger>
                      <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
                        Users ({results.total.users})
                      </TabsTrigger>
                    </TabsList>

                    {/* All Results Tab */}
                    <TabsContent value="all" className="mt-6">
                      {/* Streams Section */}
                      {results.streams.length > 0 && (
                        <div className="mb-8">
                          <h2 className="text-xl font-bold text-white mb-4">Streams</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {results.streams.slice(0, 8).map((stream) => (
                              <StreamResultCard key={stream.id} stream={stream} />
                            ))}
                          </div>
                          {results.total.streams > 8 && (
                            <button
                              onClick={() => handleTabChange('streams')}
                              className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                            >
                              View all {results.total.streams} streams →
                            </button>
                          )}
                        </div>
                      )}

                      {/* Users Section */}
                      {results.users.length > 0 && (
                        <div className="mb-8">
                          <h2 className="text-xl font-bold text-white mb-4">Users</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.users.slice(0, 4).map((user) => (
                              <UserResultCard key={user.id} user={user} />
                            ))}
                          </div>
                          {results.total.users > 4 && (
                            <button
                              onClick={() => handleTabChange('users')}
                              className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                            >
                              View all {results.total.users} users →
                            </button>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Streams Only Tab */}
                    <TabsContent value="streams" className="mt-6">
                      {results.streams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {results.streams.map((stream) => (
                            <StreamResultCard key={stream.id} stream={stream} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                          <SearchX className="w-16 h-16 text-zinc-600 mb-4" />
                          <p className="text-zinc-400">No streams found</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Users Only Tab */}
                    <TabsContent value="users" className="mt-6">
                      {results.users.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.users.map((user) => (
                            <UserResultCard key={user.id} user={user} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                          <SearchX className="w-16 h-16 text-zinc-600 mb-4" />
                          <p className="text-zinc-400">No users found</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
