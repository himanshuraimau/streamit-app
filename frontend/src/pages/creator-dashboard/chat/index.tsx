import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Shield, Settings } from 'lucide-react';

export default function Chat() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Chat Management</h1>
          <p className="text-zinc-400">Moderate and manage your stream chat</p>
        </div>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
          <Settings className="w-4 h-4 mr-2" />
          Chat Settings
        </Button>
      </div>

      {/* Chat Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Messages Today</h3>
              <p className="text-2xl font-bold text-blue-400">1,234</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Active Chatters</h3>
              <p className="text-2xl font-bold text-green-400">89</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Moderated</h3>
              <p className="text-2xl font-bold text-red-400">12</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Moderation Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Moderation Tools</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <span className="text-zinc-300">Slow Mode</span>
              <Button size="sm" variant="outline" className="border-zinc-700">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <span className="text-zinc-300">Subscriber Only</span>
              <Button size="sm" variant="outline" className="border-zinc-700">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <span className="text-zinc-300">Emote Only</span>
              <Button size="sm" variant="outline" className="border-zinc-700">
                Enable
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Banned Words</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Add banned word..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <Button size="sm">Add</Button>
            </div>
            <div className="text-sm text-zinc-400">
              <p>Current banned words: spam, hate, toxic</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Placeholder Content */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Advanced Chat Features</h3>
          <p className="text-zinc-400 mb-4">
            Real-time chat monitoring, advanced moderation tools, chat analytics, and custom commands will be available here.
          </p>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}