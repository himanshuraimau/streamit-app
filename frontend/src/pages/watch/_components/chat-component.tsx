import { useState, useEffect, useRef } from 'react';
import { useChat, useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface ChatComponentProps {
  hostName: string;
  isChatEnabled: boolean;
  isChatFollowersOnly: boolean;
  isChatDelayed: boolean;
  isFollowing?: boolean;
  variant?: 'default' | 'compact';
}

export function ChatComponent({ 
  hostName, 
  isChatEnabled, 
  isChatFollowersOnly, 
  isChatDelayed,
  isFollowing = false,
  variant = 'default'
}: ChatComponentProps) {
  const [message, setMessage] = useState('');
  const { chatMessages, send } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionState = useConnectionState();

  // Check if room is connected
  const isConnected = connectionState === ConnectionState.Connected;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !send || !isConnected) return;

    try {
      await send(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if user can chat
  const canChat = () => {
    if (!isChatEnabled) return false;
    if (isChatFollowersOnly && !isFollowing) return false;
    return true;
  };

  const getDisabledMessage = () => {
    if (!isChatEnabled) return 'Chat is disabled';
    if (isChatFollowersOnly && !isFollowing) return 'Only followers can chat';
    if (!isConnected) return 'Connecting to chat...';
    return '';
  };

  const isCompact = variant === 'compact';

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className={`${isCompact ? 'p-3' : 'p-4'} border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-purple-400`} />
            <h3 className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-white`}>Live Chat</h3>
            {isChatDelayed && (
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                Delayed
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
            <span className="hidden sm:inline">{isConnected ? 'Connected' : 'Connecting'}</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">No messages yet</p>
                <p className="text-xs text-zinc-600 mt-1">Be the first to say hello!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg, index) => (
              <div 
                key={`${msg.timestamp}-${index}`}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start gap-2 group hover:bg-zinc-800/30 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                      {(msg.from?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-semibold text-purple-400 text-sm truncate">
                        {msg.from?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {format(msg.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200 break-words leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className={`${isCompact ? 'p-3' : 'p-4'} border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0`}>
        {canChat() ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isConnected 
                    ? `Message ${hostName}...` 
                    : 'Connecting to chat...'
                }
                className="flex-1 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                maxLength={500}
                disabled={!isConnected}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !send || !isConnected}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                size={isCompact ? 'sm' : 'default'}
              >
                <Send className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{message.length}/500</span>
              <span>Press Enter to send</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-zinc-500 py-4">
            <Lock className="w-4 h-4" />
            <span className="text-sm">{getDisabledMessage()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
