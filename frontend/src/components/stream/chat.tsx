import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat, useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, MessageSquare, Lock, Ban, UserCheck, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { useBlockedUsers } from '@/contexts/BlockedUsersContext';
import { filterBlockedMessages, type ChatMessage } from '@/lib/viewer-preferences';

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
  const connectionState = useConnectionState();
  
  // Get blocked users context - may be null if not wrapped in provider
  let blockedUsersContext: ReturnType<typeof useBlockedUsers> | null = null;
  try {
    blockedUsersContext = useBlockedUsers();
  } catch {
    // Context not available, blocking features will be disabled
  }

  // Check if room is connected
  const isConnected = connectionState === ConnectionState.Connected;

  // Filter out messages from blocked users
  const filteredMessages = blockedUsersContext
    ? filterBlockedMessages(
        chatMessages as unknown as ChatMessage[],
        blockedUsersContext.blockedUserIds
      )
    : chatMessages;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

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

  // Handle blocking/unblocking a user
  const handleBlockUser = useCallback((userId: string) => {
    if (blockedUsersContext) {
      blockedUsersContext.blockUser(userId);
    }
  }, [blockedUsersContext]);

  const handleUnblockUser = useCallback((userId: string) => {
    if (blockedUsersContext) {
      blockedUsersContext.unblockUser(userId);
    }
  }, [blockedUsersContext]);

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
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-zinc-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Be the first to send a message!</p>
            </div>
          </div>
        ) : (
          <>
            {(filteredMessages as typeof chatMessages).map((msg, index) => {
              const senderId = msg.from?.identity;
              const isBlocked = senderId && blockedUsersContext?.isBlocked(senderId);
              
              return (
                <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-300 group">
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
                    {/* Context menu for blocking users */}
                    {blockedUsersContext && senderId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white hover:bg-zinc-700"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Message options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                          {isBlocked ? (
                            <DropdownMenuItem
                              onClick={() => handleUnblockUser(senderId)}
                              className="text-green-400 hover:text-green-300 focus:text-green-300 cursor-pointer"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unblock User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleBlockUser(senderId)}
                              className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Block User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
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
              placeholder={
                isConnected 
                  ? `Send a message to ${hostName}...` 
                  : 'Connecting to chat...'
              }
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              maxLength={500}
              disabled={!isConnected}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !send || !isConnected}
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
