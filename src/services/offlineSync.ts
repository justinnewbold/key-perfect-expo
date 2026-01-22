import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats } from '../types';

export type SyncPriority = 'high' | 'medium' | 'low';
export type SyncAction =
  | 'save_stats'
  | 'save_settings'
  | 'complete_daily'
  | 'submit_score'
  | 'unlock_achievement'
  | 'complete_level'
  | 'analytics_event';

export interface OfflineSyncItem {
  id: string;
  action: SyncAction;
  priority: SyncPriority;
  data: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
}

export interface SyncResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  conflictsResolved: number;
}

const STORAGE_KEYS = {
  SYNC_QUEUE: 'keyPerfect_offlineSyncQueue',
  CACHED_LEADERBOARD: 'keyPerfect_cachedLeaderboard',
  CACHED_TOURNAMENT: 'keyPerfect_cachedTournament',
  LAST_SYNC: 'keyPerfect_lastSync',
};

// Priority settings
const PRIORITY_CONFIG = {
  high: { maxRetries: 10, initialDelay: 2000 },
  medium: { maxRetries: 5, initialDelay: 5000 },
  low: { maxRetries: 3, initialDelay: 10000 },
};

// Map actions to priorities
const ACTION_PRIORITY_MAP: Record<SyncAction, SyncPriority> = {
  unlock_achievement: 'high',
  complete_level: 'high',
  submit_score: 'high',
  complete_daily: 'medium',
  save_stats: 'medium',
  save_settings: 'low',
  analytics_event: 'low',
};

/**
 * Add item to offline sync queue with automatic priority assignment
 */
export async function addToOfflineQueue(
  action: SyncAction,
  data: unknown
): Promise<void> {
  try {
    const priority = ACTION_PRIORITY_MAP[action];
    const config = PRIORITY_CONFIG[priority];

    const item: OfflineSyncItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      action,
      priority,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: config.maxRetries,
    };

    const queue = await getOfflineQueue();
    queue.push(item);

    // Sort by priority (high -> medium -> low) and timestamp (oldest first)
    queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
}

/**
 * Get offline sync queue
 */
export async function getOfflineQueue(): Promise<OfflineSyncItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading offline queue:', error);
  }
  return [];
}

/**
 * Process offline sync queue with retry logic and conflict resolution
 */
export async function processOfflineQueue(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    processedCount: 0,
    failedCount: 0,
    conflictsResolved: 0,
  };

  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) {
      return result;
    }

    const now = Date.now();
    const itemsToProcess: OfflineSyncItem[] = [];
    const itemsToRetry: OfflineSyncItem[] = [];
    const itemsToDiscard: OfflineSyncItem[] = [];

    // Categorize items based on retry logic
    for (const item of queue) {
      if (item.retryCount >= item.maxRetries) {
        itemsToDiscard.push(item);
        continue;
      }

      if (item.lastAttempt) {
        const config = PRIORITY_CONFIG[item.priority];
        const backoffDelay = config.initialDelay * Math.pow(2, item.retryCount);
        const nextRetryTime = item.lastAttempt + backoffDelay;

        if (now < nextRetryTime) {
          itemsToRetry.push(item);
          continue;
        }
      }

      itemsToProcess.push(item);
    }

    // Process items with conflict resolution
    for (const item of itemsToProcess) {
      try {
        const processed = await processSyncItem(item);

        if (processed) {
          result.processedCount++;
        } else {
          // Failed, increment retry count
          item.retryCount++;
          item.lastAttempt = now;
          itemsToRetry.push(item);
          result.failedCount++;
        }
      } catch (error) {
        console.error(`Error processing sync item ${item.id}:`, error);
        item.retryCount++;
        item.lastAttempt = now;
        itemsToRetry.push(item);
        result.failedCount++;
      }
    }

    // Save updated queue (items to retry + items that couldn't be processed yet)
    await AsyncStorage.setItem(
      STORAGE_KEYS.SYNC_QUEUE,
      JSON.stringify(itemsToRetry)
    );

    // Log discarded items
    if (itemsToDiscard.length > 0) {
      console.warn(`Discarded ${itemsToDiscard.length} items after max retries`);
    }

    // Update last sync time
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toString());
  } catch (error) {
    console.error('Error processing offline queue:', error);
    result.success = false;
  }

  return result;
}

/**
 * Process individual sync item (mock implementation)
 */
async function processSyncItem(item: OfflineSyncItem): Promise<boolean> {
  // In a real app, this would make API calls
  // For now, we just simulate success after delay
  console.log(`Processing ${item.priority} priority item: ${item.action}`);

  // Simulate API call with 90% success rate
  await new Promise(resolve => setTimeout(resolve, 100));
  return Math.random() > 0.1;
}

/**
 * Resolve conflicts when syncing (e.g., take max score, merge achievements)
 */
export async function resolveConflict(
  localData: any,
  remoteData: any,
  conflictType: string
): Promise<any> {
  switch (conflictType) {
    case 'score':
      // Take the higher score
      return {
        ...remoteData,
        score: Math.max(localData.score || 0, remoteData.score || 0),
      };

    case 'stats':
      // Merge stats, taking max for most fields
      return {
        totalXP: Math.max(localData.totalXP || 0, remoteData.totalXP || 0),
        currentStreak: Math.max(localData.currentStreak || 0, remoteData.currentStreak || 0),
        longestStreak: Math.max(localData.longestStreak || 0, remoteData.longestStreak || 0),
        correctAnswers: Math.max(localData.correctAnswers || 0, remoteData.correctAnswers || 0),
        totalAttempts: Math.max(localData.totalAttempts || 0, remoteData.totalAttempts || 0),
        levelsCompleted: Math.max(localData.levelsCompleted || 0, remoteData.levelsCompleted || 0),
      };

    case 'achievements':
      // Merge achievement arrays (union)
      const localAchievements = localData.unlockedAchievements || [];
      const remoteAchievements = remoteData.unlockedAchievements || [];
      return {
        unlockedAchievements: Array.from(
          new Set([...localAchievements, ...remoteAchievements])
        ),
      };

    default:
      // Default: take remote (server wins)
      return remoteData;
  }
}

/**
 * Cache leaderboard data for offline viewing
 */
export async function cacheLeaderboardData(data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CACHED_LEADERBOARD,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error caching leaderboard:', error);
  }
}

/**
 * Get cached leaderboard data
 */
export async function getCachedLeaderboard(): Promise<{ data: any; cachedAt: number } | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_LEADERBOARD);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error loading cached leaderboard:', error);
  }
  return null;
}

/**
 * Cache tournament data for offline viewing
 */
export async function cacheTournamentData(data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CACHED_TOURNAMENT,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error caching tournament:', error);
  }
}

/**
 * Get cached tournament data
 */
export async function getCachedTournament(): Promise<{ data: any; cachedAt: number } | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_TOURNAMENT);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error loading cached tournament:', error);
  }
  return null;
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error loading last sync time:', error);
    return null;
  }
}

/**
 * Clear all offline data (for testing/reset)
 */
export async function clearOfflineData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE),
      AsyncStorage.removeItem(STORAGE_KEYS.CACHED_LEADERBOARD),
      AsyncStorage.removeItem(STORAGE_KEYS.CACHED_TOURNAMENT),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
    ]);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

/**
 * Batch add multiple items to queue (more efficient)
 */
export async function batchAddToOfflineQueue(items: { action: SyncAction; data: unknown }[]): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const now = Date.now();

    const newItems: OfflineSyncItem[] = items.map((item, index) => {
      const priority = ACTION_PRIORITY_MAP[item.action];
      const config = PRIORITY_CONFIG[priority];

      return {
        id: `${now + index}-${Math.random().toString(36).slice(2, 11)}`,
        action: item.action,
        priority,
        data: item.data,
        timestamp: now + index, // Slightly offset timestamps
        retryCount: 0,
        maxRetries: config.maxRetries,
      };
    });

    queue.push(...newItems);

    // Sort by priority and timestamp
    queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error batch adding to offline queue:', error);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStatistics(): Promise<{
  total: number;
  byPriority: { high: number; medium: number; low: number };
  oldestItem: number | null;
  avgRetries: number;
}> {
  try {
    const queue = await getOfflineQueue();

    const byPriority = {
      high: queue.filter(i => i.priority === 'high').length,
      medium: queue.filter(i => i.priority === 'medium').length,
      low: queue.filter(i => i.priority === 'low').length,
    };

    const oldestItem = queue.length > 0 ? Math.min(...queue.map(i => i.timestamp)) : null;

    const avgRetries =
      queue.length > 0 ? queue.reduce((sum, i) => sum + i.retryCount, 0) / queue.length : 0;

    return {
      total: queue.length,
      byPriority,
      oldestItem,
      avgRetries,
    };
  } catch (error) {
    console.error('Error getting queue statistics:', error);
    return {
      total: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
      oldestItem: null,
      avgRetries: 0,
    };
  }
}

/**
 * Force sync specific action types
 */
export async function forceSyncByAction(action: SyncAction): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    processedCount: 0,
    failedCount: 0,
    conflictsResolved: 0,
  };

  try {
    const queue = await getOfflineQueue();
    const itemsToSync = queue.filter(i => i.action === action);
    const remainingItems = queue.filter(i => i.action !== action);

    for (const item of itemsToSync) {
      try {
        const processed = await processSyncItem(item);
        if (processed) {
          result.processedCount++;
        } else {
          result.failedCount++;
          remainingItems.push(item);
        }
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        result.failedCount++;
        remainingItems.push(item);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(remainingItems));
  } catch (error) {
    console.error('Error force syncing by action:', error);
    result.success = false;
  }

  return result;
}

/**
 * Estimate sync time remaining
 */
export async function estimateSyncTime(): Promise<number> {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return 0;

    // Estimate 100ms per item (mock, adjust based on real API performance)
    const AVG_ITEM_TIME = 100; // ms
    return queue.length * AVG_ITEM_TIME;
  } catch (error) {
    console.error('Error estimating sync time:', error);
    return 0;
  }
}

/**
 * Get failed items (items that exceeded max retries)
 */
export async function getFailedItems(): Promise<OfflineSyncItem[]> {
  try {
    const queue = await getOfflineQueue();
    return queue.filter(i => i.retryCount >= i.maxRetries);
  } catch (error) {
    console.error('Error getting failed items:', error);
    return [];
  }
}

/**
 * Retry failed items (reset retry count)
 */
export async function retryFailedItems(): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    queue.forEach(item => {
      if (item.retryCount >= item.maxRetries) {
        item.retryCount = 0;
        item.lastAttempt = undefined;
      }
    });
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error retrying failed items:', error);
  }
}

/**
 * Remove specific item from queue
 */
export async function removeFromQueue(itemId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter(i => i.id !== itemId);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from queue:', error);
  }
}
