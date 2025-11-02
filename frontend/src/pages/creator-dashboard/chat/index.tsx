import { Card } from '@/components/ui/card';
import { MessageCircle, Shield } from 'lucide-react';

export default function Chat() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Chat Management</h1>
          <p className="text-zinc-400">Moderate and manage your stream chat</p>
        </div>
      </div>

      {/* Coming Soon - Chat Features */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Advanced Chat Features</h3>
          <p className="text-zinc-400 mb-4">
            Real-time chat monitoring and moderation features will be available here soon:
          </p>
          <div className="max-w-2xl mx-auto text-left space-y-2 text-zinc-400">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span>Real-time chat monitoring and message history</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span>Advanced moderation tools (slow mode, emote only, followers only)</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span>Banned words and auto-moderation filters</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-400" />
              <span>Chat analytics and engagement metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Moderator management and permissions</span>
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-6">Coming soon...</p>
          <p className="text-zinc-600 text-xs mt-2">
            Note: Basic chat settings can be configured in the Streams page
          </p>
        </div>
      </Card>
    </div>
  );
}