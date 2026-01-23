import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncQueueItem {
  id: string;
  action: 'save_stats' | 'save_settings' | 'complete_daily';
  data: unknown;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'keyPerfect_syncQueue';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  pendingSyncCount: number;
  isSyncing: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    pendingSyncCount: 0,
    isSyncing: false,
  });

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  // Load sync queue from storage
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        if (queueData) {
          const queue = JSON.parse(queueData) as SyncQueueItem[];
          setSyncQueue(queue);
          setStatus(prev => ({ ...prev, pendingSyncCount: queue.length }));
        }
      } catch (error) {
        console.error('Error loading sync queue:', error);
      }
    };
    loadQueue();
  }, []);

  // Subscribe to network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus(prev => ({
        ...prev,
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      }));
    });

    return () => unsubscribe();
  }, []);

  // Add item to sync queue
  const addToSyncQueue = useCallback(async (
    action: SyncQueueItem['action'],
    data: unknown
  ) => {
    const newItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      action,
      data,
      timestamp: Date.now(),
    };

    // Use functional setState to avoid stale closure
    setSyncQueue(prevQueue => {
      const updatedQueue = [...prevQueue, newItem];
      setStatus(prev => ({ ...prev, pendingSyncCount: updatedQueue.length }));

      // Save to storage asynchronously
      AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue))
        .catch(error => console.error('Error saving sync queue:', error));

      return updatedQueue;
    });
  }, []); // No dependencies needed with functional setState

  // Process sync queue when online
  const processSyncQueue = useCallback(async () => {
    // Use functional setState to get latest values without dependencies
    let shouldProcess = false;
    let currentQueue: SyncQueueItem[] = [];

    setStatus(prev => {
      shouldProcess = prev.isConnected && !prev.isSyncing;
      return shouldProcess ? { ...prev, isSyncing: true } : prev;
    });

    if (!shouldProcess) {
      return;
    }

    setSyncQueue(prevQueue => {
      currentQueue = prevQueue;
      return prevQueue;
    });

    if (currentQueue.length === 0) {
      setStatus(prev => ({ ...prev, isSyncing: false }));
      return;
    }

    try {
      // Process each item in the queue
      const processedIds: string[] = [];

      for (const item of currentQueue) {
        try {
          // In a real app, this would sync with a backend
          // For now, we just mark items as processed
          console.log(`Processing sync item: ${item.action}`, item.data);
          processedIds.push(item.id);
        } catch (error) {
          console.error(`Error processing sync item ${item.id}:`, error);
          // Don't add to processed if there was an error
        }
      }

      // Remove processed items from queue
      setSyncQueue(prevQueue => {
        const remainingQueue = prevQueue.filter(item => !processedIds.includes(item.id));

        setStatus(prev => ({
          ...prev,
          pendingSyncCount: remainingQueue.length,
          isSyncing: false,
        }));

        // Save to storage asynchronously
        AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue))
          .catch(error => console.error('Error saving sync queue:', error));

        return remainingQueue;
      });
    } catch (error) {
      console.error('Error processing sync queue:', error);
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, []); // No dependencies needed with functional setState

  // Clear sync queue
  const clearSyncQueue = useCallback(async () => {
    setSyncQueue([]);
    setStatus(prev => ({ ...prev, pendingSyncCount: 0 }));
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }, []);

  return {
    ...status,
    addToSyncQueue,
    processSyncQueue,
    clearSyncQueue,
  };
}

export default useNetworkStatus;
