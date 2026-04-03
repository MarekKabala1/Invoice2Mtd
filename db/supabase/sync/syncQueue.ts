/**
 * syncQueue.ts
 *
 * Sync queue operations using AsyncStorage for persistence.
 * Tracks pending changes that need to sync to Supabase.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { SyncQueueItem, SyncAction } from './sync.types';

const SYNC_QUEUE_KEY = '@supabase_sync_queue';
const MAX_RETRY_COUNT = 3;

export const addToQueue = async (
  item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>
): Promise<void> => {
  const queue = await getQueue();
  
  const existingIndex = queue.findIndex(
    (q) => q.table === item.table && q.localId === item.localId
  );
  
  if (existingIndex >= 0) {
    queue[existingIndex] = {
      ...queue[existingIndex],
      action: item.action,
      timestamp: Date.now(),
    };
  } else {
    queue.push({
      ...item,
      id: uuid.v4() as string,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }
  
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

export const getQueue = async (): Promise<SyncQueueItem[]> => {
  const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data) as SyncQueueItem[];
  } catch {
    return [];
  }
};

export const removeFromQueue = async (id: string): Promise<void> => {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
};

export const clearQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
};

export const markAsSynced = async (localId: string): Promise<void> => {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.localId !== localId);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
};

export const markAsFailed = async (
  localId: string,
  _error: string
): Promise<void> => {
  const queue = await getQueue();
  const updated = queue.map((item) =>
    item.localId === localId
      ? { ...item, retryCount: item.retryCount + 1 }
      : item
  );
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
};

export const incrementRetry = async (localId: string): Promise<void> => {
  const queue = await getQueue();
  const updated = queue.map((item) =>
    item.localId === localId ? { ...item, retryCount: item.retryCount + 1 } : item
  );
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
};

export const getPendingCount = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.filter((item) => item.retryCount < MAX_RETRY_COUNT).length;
};

export const getFailedItems = async (): Promise<SyncQueueItem[]> => {
  const queue = await getQueue();
  return queue.filter((item) => item.retryCount >= MAX_RETRY_COUNT);
};

export const canRetry = (item: SyncQueueItem): boolean => {
  return item.retryCount < MAX_RETRY_COUNT;
};
