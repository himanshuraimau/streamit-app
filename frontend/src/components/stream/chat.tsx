import { useState, useEffect, useRef } from 'react';
import { useChat, useRoomContext } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface ChatProps {
  hostName: string;
  isChatEnabled: boolean;
  isChatFollowersOnly: boolean;
  isChatDelayed: boolean;
  isFollowing?: boolean;
}

export function Chat({ 
  hostName, 
  isChatEnabled, 
  isChatFollowersOnly, 
  isChatDelayed,
  isFollowing = false 
}: ChatProps) {
  const [message, setMessage] = useState('');
  const { chatMessages, send } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const room = useRoomContext();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !send) return;

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
    return '';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">Live Chat</h3>
          {isChatDelayed && (
            <span className="ml-auto text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
              Delayed
            </span>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-zinc-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Be the first to send a message!</p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, index) => (
              <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-purple-400 text-sm">
                        {msg.from?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {format(msg.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200 mt-0.5 wrap-break-word">
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-zinc-800">
        {canChat() ? (
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Send a message to ${hostName}...`}
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              maxLength={500}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !send || !room}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-zinc-500 py-3">
            <Lock className="w-4 h-4" />
            <span className="text-sm">{getDisabledMessage()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
