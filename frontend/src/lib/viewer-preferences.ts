/**
 * Viewer Preferences Storage Utilities
 * 
 * Provides functions for persisting viewer preferences to localStorage.
 * Handles localStorage unavailability gracefully by falling back to in-memory storage.
 * 
 * Requirements: 6.2, 6.3, 7.3
 */

// Storage keys as defined in the design document
const STORAGE_KEYS = {
  CHAT_VISIBLE: 'streamit_chat_visible',
  BLOCKED_USERS: 'streamit_blocked_users',
  VIEWER_PREFS: 'streamit_viewer_prefs',
} as const;

// In-memory fallback storage for when localStorage is unavailable
const memoryStorage: {
  chatVisible: boolean;
  blockedUsers: string[];
} = {
  chatVisible: true,
  blockedUsers: [],
};

/**
 * Checks if localStorage is available and functional
 * @returns true if localStorage is available, false otherwise
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves the chat visibility preference
 * 
 * @param visible - Whether the chat should be visible
 * 
 * Requirements: 6.2 - WHEN a viewer toggles chat visibility, THE System SHALL persist the preference locally
 */
export function saveChatVisibility(visible: boolean): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_VISIBLE, JSON.stringify(visible));
    } catch {
      // Fall back to memory storage on write failure
      memoryStorage.chatVisible = visible;
    }
  } else {
    memoryStorage.chatVisible = visible;
  }
}

/**
 * Gets the chat visibility preference
 * 
 * @returns The saved chat visibility preference, defaults to true if not set
 * 
 * Requirements: 6.3 - WHEN a viewer returns to the stream, THE System SHALL restore their chat visibility preference
 */
export function getChatVisibility(): boolean {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_VISIBLE);
      if (stored === null) {
        return true; // Default to visible
      }
      return JSON.parse(stored) as boolean;
    } catch {
      return memoryStorage.chatVisible;
    }
  }
  return memoryStorage.chatVisible;
}

/**
 * Saves the list of blocked user IDs
 * 
 * @param userIds - Array of user IDs to block
 * 
 * Requirements: 7.3 - THE System SHALL persist blocked users list in local storage
 */
export function saveBlockedUsers(userIds: string[]): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(userIds));
    } catch {
      // Fall back to memory storage on write failure
      memoryStorage.blockedUsers = [...userIds];
    }
  } else {
    memoryStorage.blockedUsers = [...userIds];
  }
}

/**
 * Gets the list of blocked user IDs
 * 
 * @returns Array of blocked user IDs, defaults to empty array if not set
 * 
 * Requirements: 7.3 - THE System SHALL persist blocked users list in local storage
 */
export function getBlockedUsers(): string[] {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
      if (stored === null) {
        return [];
      }
      const parsed = JSON.parse(stored);
      // Validate that parsed value is an array of strings
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
      return [];
    } catch {
      return memoryStorage.blockedUsers;
    }
  }
  return memoryStorage.blockedUsers;
}

/**
 * Adds a user ID to the blocked users list
 * 
 * @param userId - The user ID to block
 * 
 * Requirements: 7.3 - THE System SHALL persist blocked users list in local storage
 */
export function addBlockedUser(userId: string): void {
  const blockedUsers = getBlockedUsers();
  if (!blockedUsers.includes(userId)) {
    blockedUsers.push(userId);
    saveBlockedUsers(blockedUsers);
  }
}

/**
 * Removes a user ID from the blocked users list
 * 
 * @param userId - The user ID to unblock
 * 
 * Requirements: 7.4 - WHEN a viewer unblocks a user, THE System SHALL restore visibility of their messages
 */
export function removeBlockedUser(userId: string): void {
  const blockedUsers = getBlockedUsers();
  const index = blockedUsers.indexOf(userId);
  if (index !== -1) {
    blockedUsers.splice(index, 1);
    saveBlockedUsers(blockedUsers);
  }
}

/**
 * Checks if a user is blocked
 * 
 * @param userId - The user ID to check
 * @returns true if the user is blocked, false otherwise
 */
export function isUserBlocked(userId: string): boolean {
  return getBlockedUsers().includes(userId);
}

/**
 * Clears all blocked users
 */
export function clearBlockedUsers(): void {
  saveBlockedUsers([]);
}

/**
 * Chat Message interface for filtering
 * Represents a message from the LiveKit chat system
 */
export interface ChatMessage {
  from?: {
    identity?: string;
    name?: string;
  };
  message: string;
  timestamp: number;
}

/**
 * Filters out messages from blocked users
 * 
 * @param messages - Array of chat messages to filter
 * @param blockedUserIds - Set or array of blocked user IDs
 * @returns Array of messages excluding those from blocked users
 * 
 * Requirements: 7.2 - WHEN a viewer blocks a user, THE System SHALL hide all messages from that user locally
 */
export function filterBlockedMessages<T extends ChatMessage>(
  messages: T[],
  blockedUserIds: Set<string> | string[]
): T[] {
  // Convert array to Set for O(1) lookup if needed
  const blockedSet = blockedUserIds instanceof Set 
    ? blockedUserIds 
    : new Set(blockedUserIds);
  
  // If no blocked users, return original array
  if (blockedSet.size === 0) {
    return messages;
  }
  
  return messages.filter((msg) => {
    // If message has no sender identity, include it (system messages, etc.)
    const senderId = msg.from?.identity;
    if (!senderId) {
      return true;
    }
    
    // Exclude messages from blocked users
    return !blockedSet.has(senderId);
  });
}

// Export storage keys for testing purposes
export { STORAGE_KEYS };
