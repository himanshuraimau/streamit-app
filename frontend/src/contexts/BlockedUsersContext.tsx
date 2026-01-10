/**
 * BlockedUsersContext
 * 
 * Context provider for managing locally blocked users in chat.
 * Persists blocked users to localStorage and provides methods to block/unblock users.
 * 
 * Requirements: 7.2, 7.3, 7.4
 */

import * as React from 'react';
import {
  getBlockedUsers,
  addBlockedUser,
  removeBlockedUser,
} from '@/lib/viewer-preferences';

/**
 * Context value interface as defined in the design document
 */
export interface BlockedUsersContextValue {
  blockedUserIds: Set<string>;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
}

const BlockedUsersContext = React.createContext<BlockedUsersContextValue | null>(null);

/**
 * Hook to access the blocked users context
 * 
 * @throws Error if used outside of BlockedUsersProvider
 * @returns BlockedUsersContextValue
 */
export function useBlockedUsers(): BlockedUsersContextValue {
  const context = React.useContext(BlockedUsersContext);
  if (!context) {
    throw new Error('useBlockedUsers must be used within a BlockedUsersProvider.');
  }
  return context;
}

interface BlockedUsersProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for blocked users context
 * 
 * Initializes blocked users from localStorage on mount and provides
 * methods to block/unblock users with automatic persistence.
 * 
 * Requirements:
 * - 7.2: WHEN a viewer blocks a user, THE System SHALL hide all messages from that user locally
 * - 7.3: THE System SHALL persist blocked users list in local storage
 * - 7.4: WHEN a viewer unblocks a user, THE System SHALL restore visibility of their messages
 */
export function BlockedUsersProvider({ children }: BlockedUsersProviderProps) {
  // Initialize state from localStorage
  const [blockedUserIds, setBlockedUserIds] = React.useState<Set<string>>(() => {
    const storedUsers = getBlockedUsers();
    return new Set(storedUsers);
  });

  /**
   * Blocks a user by adding their ID to the blocked set
   * Persists to localStorage automatically
   * 
   * @param userId - The user ID to block
   */
  const blockUser = React.useCallback((userId: string) => {
    setBlockedUserIds((prev) => {
      if (prev.has(userId)) {
        return prev; // Already blocked, no change needed
      }
      const newSet = new Set(prev);
      newSet.add(userId);
      // Persist to localStorage
      addBlockedUser(userId);
      return newSet;
    });
  }, []);

  /**
   * Unblocks a user by removing their ID from the blocked set
   * Persists to localStorage automatically
   * 
   * @param userId - The user ID to unblock
   */
  const unblockUser = React.useCallback((userId: string) => {
    setBlockedUserIds((prev) => {
      if (!prev.has(userId)) {
        return prev; // Not blocked, no change needed
      }
      const newSet = new Set(prev);
      newSet.delete(userId);
      // Persist to localStorage
      removeBlockedUser(userId);
      return newSet;
    });
  }, []);

  /**
   * Checks if a user is currently blocked
   * 
   * @param userId - The user ID to check
   * @returns true if the user is blocked, false otherwise
   */
  const isBlocked = React.useCallback(
    (userId: string) => {
      return blockedUserIds.has(userId);
    },
    [blockedUserIds]
  );

  const contextValue = React.useMemo<BlockedUsersContextValue>(
    () => ({
      blockedUserIds,
      blockUser,
      unblockUser,
      isBlocked,
    }),
    [blockedUserIds, blockUser, unblockUser, isBlocked]
  );

  return (
    <BlockedUsersContext.Provider value={contextValue}>
      {children}
    </BlockedUsersContext.Provider>
  );
}

export { BlockedUsersContext };
