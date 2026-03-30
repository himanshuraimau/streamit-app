import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Video,
  BarChart3,
  Users,
  Clock,
  Loader2,
  Coins,
  Heart,
  Gift,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { streamApi, type StreamSummary } from '@/lib/api/stream';
import { formatDurationBetween } from '@/lib/utils';
import {
  calculateStreamEarnings,
  fetchAllReceivedGiftsForStream,
} from './stream-metrics';

interface StreamEndedViewProps {
  streamId: string;
  streamTitle?: string;
  onStartNewStream: () => void;
}

export function StreamEndedView({
  streamId,
  streamTitle,
  onStartNewStream,
}: StreamEndedViewProps) {
  const [summary, setSummary] = useState<StreamSummary | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      setLoading(true);

      try {
        const [summaryResponse, gifts] = await Promise.all([
          streamApi.getStreamSummary(streamId),
          fetchAllReceivedGiftsForStream(streamId),
        ]);

        if (!isMounted) {
          return;
        }

        if (summaryResponse.success && summaryResponse.data) {
          setSummary(summaryResponse.data);
        }

        setEarnings(calculateStreamEarnings(gifts));
      } catch (error) {
        console.error('[StreamEndedView] Failed to load summary:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [streamId]);

  const durationLabel = useMemo(() => {
    if (!summary) {
      return '00:00:00';
    }

    return formatDurationBetween(summary.startedAt, summary.endedAt);
  }, [summary]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Stream Ended Successfully</h1>
        <p className="text-zinc-400">
          {summary?.title || streamTitle || 'Your live stream'} has been wrapped with live stats.
        </p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Stream Summary</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Duration</p>
                <p className="text-2xl font-bold text-white">{durationLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Peak Viewers</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.peakViewers?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
              <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                <Heart className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Likes</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.totalLikes?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Actual Earnings</p>
                <p className="text-2xl font-bold text-white">{earnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Gift className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Gifts Received</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.totalGifts?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
              <div className="p-2 bg-sky-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Viewers</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.totalViewers?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {!loading && summary?.topGifter && (
        <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/40 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-yellow-400/10 p-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-yellow-200/70">
                Top Gifter
              </p>
              <p className="text-xl font-semibold text-white">
                {summary.topGifter.name || summary.topGifter.username}
              </p>
              <p className="text-sm text-yellow-100/80">
                {summary.topGifter.totalCoins.toLocaleString()} coins sent this stream
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={onStartNewStream}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
        >
          <Video className="w-5 h-5 mr-2" />
          Start New Stream
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            window.location.href = '/creator-dashboard/overview';
          }}
          className="w-full sm:w-auto border-zinc-700 hover:bg-zinc-800"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          View Dashboard
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">What’s Next?</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>• Review your live metrics and gifting momentum in the dashboard</li>
          <li>• Clip or repost strong moments while the stream is still fresh</li>
          <li>• Start a new stream whenever you are ready to go live again</li>
        </ul>
      </Card>
    </div>
  );
}
