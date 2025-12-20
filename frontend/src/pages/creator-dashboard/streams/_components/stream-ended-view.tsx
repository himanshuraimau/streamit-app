import { CheckCircle, Video, BarChart3, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StreamEndedViewProps {
  onStartNewStream: () => void;
}

export function StreamEndedView({ onStartNewStream }: StreamEndedViewProps) {
  // TODO: Add actual stream statistics from backend
  const streamStats = {
    duration: '0h 0m', // Calculate from actual stream duration
    peakViewers: 0,
    totalMessages: 0,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      {/* Success Message */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Stream Ended Successfully</h1>
        <p className="text-zinc-400">
          Your live stream has been ended
        </p>
      </div>

      {/* Stream Statistics */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Stream Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Duration</p>
              <p className="text-2xl font-bold text-white">{streamStats.duration}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Peak Viewers</p>
              <p className="text-2xl font-bold text-white">{streamStats.peakViewers}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Chat Messages</p>
              <p className="text-2xl font-bold text-white">{streamStats.totalMessages}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
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

      {/* Quick Tips */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">What's Next?</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>• Your stream has been ended successfully</li>
          <li>• Check your dashboard to see detailed performance metrics</li>
          <li>• Start a new stream anytime you're ready</li>
          <li>• Share highlights with your community</li>
        </ul>
      </Card>
    </div>
  );
}
