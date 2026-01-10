import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, MessageSquareOff } from 'lucide-react';
import { getChatVisibility, saveChatVisibility } from '@/lib/viewer-preferences';

/**
 * ChatVisibilityToggle Component
 * 
 * A toggle button that allows viewers to hide/show the chat panel.
 * Persists the preference to localStorage and restores it on mount.
 * 
 * Requirements:
 * - 6.1: THE Stream_Player SHALL display a toggle button to hide/show the chat panel
 * - 6.2: WHEN a viewer toggles chat visibility, THE System SHALL persist the preference locally
 * - 6.3: WHEN a viewer returns to the stream, THE System SHALL restore their chat visibility preference
 */

interface ChatVisibilityToggleProps {
  /** Whether the chat is currently visible */
  isVisible: boolean;
  /** Callback when visibility is toggled */
  onToggle: (visible: boolean) => void;
  /** Optional className for styling */
  className?: string;
  /** Variant for different display styles */
  variant?: 'default' | 'compact' | 'icon-only';
}

export function ChatVisibilityToggle({
  isVisible,
  onToggle,
  className = '',
  variant = 'default',
}: ChatVisibilityToggleProps) {
  const [mounted, setMounted] = useState(false);

  // Restore preference from localStorage on mount
  useEffect(() => {
    const savedVisibility = getChatVisibility();
    if (savedVisibility !== isVisible) {
      onToggle(savedVisibility);
    }
    setMounted(true);
  }, []);

  // Handle toggle and persist to localStorage
  const handleToggle = (checked: boolean) => {
    saveChatVisibility(checked);
    onToggle(checked);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (variant === 'icon-only') {
    return (
      <button
        onClick={() => handleToggle(!isVisible)}
        className={`p-2 rounded-lg transition-colors ${
          isVisible 
            ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30' 
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
        } ${className}`}
        title={isVisible ? 'Hide chat' : 'Show chat'}
        aria-label={isVisible ? 'Hide chat' : 'Show chat'}
      >
        {isVisible ? (
          <MessageSquare className="w-5 h-5" />
        ) : (
          <MessageSquareOff className="w-5 h-5" />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => handleToggle(!isVisible)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
            isVisible 
              ? 'bg-purple-600/20 text-purple-400' 
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {isVisible ? (
            <MessageSquare className="w-3.5 h-3.5" />
          ) : (
            <MessageSquareOff className="w-3.5 h-3.5" />
          )}
          <span>{isVisible ? 'Chat' : 'Chat hidden'}</span>
        </button>
      </div>
    );
  }

  // Default variant with switch
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        {isVisible ? (
          <MessageSquare className="w-4 h-4 text-purple-400" />
        ) : (
          <MessageSquareOff className="w-4 h-4 text-zinc-500" />
        )}
        <span className={`text-sm ${isVisible ? 'text-zinc-200' : 'text-zinc-500'}`}>
          {isVisible ? 'Chat visible' : 'Chat hidden'}
        </span>
      </div>
      <Switch
        checked={isVisible}
        onCheckedChange={handleToggle}
        aria-label="Toggle chat visibility"
      />
    </div>
  );
}

/**
 * Hook to manage chat visibility state with localStorage persistence
 * 
 * This hook provides a convenient way to manage chat visibility state
 * that automatically syncs with localStorage.
 * 
 * @returns [isVisible, setIsVisible] - Current visibility state and setter
 */
export function useChatVisibility(): [boolean, (visible: boolean) => void] {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // Initialize from localStorage on first render
    return getChatVisibility();
  });

  const setVisibility = (visible: boolean) => {
    saveChatVisibility(visible);
    setIsVisible(visible);
  };

  return [isVisible, setVisibility];
}
