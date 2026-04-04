/**
 * useCloudSync.ts
 *
 * Hook for managing Supabase cloud sync from the app.
 * Provides sync status, pending count, and trigger sync functions.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSettings } from '@/context/AppSettingsContext';

const LAST_SYNC_KEY = '@supabase_last_sync';
import {
  runSync,
  getSyncStatus,
  checkConnection,
} from '@/db/supabase/sync/syncEngine';
import type { SyncResult, SyncProgress } from '@/db/supabase/sync/sync.types';

interface UseCloudSyncReturn {
  sync: () => Promise<SyncResult | null>;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  progress: SyncProgress | null;
  refreshStatus: () => Promise<void>;
}

export const useCloudSync = (): UseCloudSyncReturn => {
  const { selectedUserId } = useAppSettings();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const loadLastSyncTime = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  };

  const saveLastSyncTime = async (time: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, time);
    } catch {
      // Silent fail
    }
  };

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      const savedLastSync = await loadLastSyncTime();
      setLastSyncTime(status.lastSync ?? savedLastSync);
      setPendingCount(status.pendingCount);
      setIsConnected(status.isConnected);
      setIsAuthenticated(status.isAuthenticated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get sync status');
    }
  }, []);

  useEffect(() => {
    const loadInitialSync = async () => {
      const savedLastSync = await loadLastSyncTime();
      if (savedLastSync) {
        setLastSyncTime(savedLastSync);
      }
    };
    loadInitialSync();
    refreshStatus();
  }, [refreshStatus]);

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (isSyncing) {
      return null;
    }

    if (!selectedUserId) {
      Alert.alert('No User', 'Please select a user first.');
      return null;
    }

    setIsSyncing(true);
    setError(null);
    setProgress(null);

    try {
      const isOnline = await checkConnection();
      if (!isOnline) {
        Alert.alert(
          'Offline',
          'Cannot sync. Please check your internet connection.'
        );
        setIsConnected(false);
        return null;
      }
      setIsConnected(true);

      const result = await runSync(selectedUserId, {
        onProgress: (p) => setProgress(p),
      });

      // Save last sync time locally
      const syncTime = new Date().toISOString();
      await saveLastSyncTime(syncTime);
      setLastSyncTime(syncTime);

      await refreshStatus();

      if (result.failed > 0) {
        const errorDetails = result.errors
          .slice(0, 3)
          .map((e) => `${e.table}: ${e.error}`)
          .join('\n');
        Alert.alert(
          'Sync Complete',
          `Synced: ${result.success}\nFailed: ${result.failed}\n\nErrors:\n${errorDetails}${result.errors.length > 3 ? '\n...' : ''}`
        );
      } else if (result.success > 0) {
        Alert.alert('Sync Complete', `Successfully synced ${result.success} items.`);
      } else {
        Alert.alert('Sync Complete', 'Nothing to sync.');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      Alert.alert('Sync Error', errorMessage);
      return null;
    } finally {
      setIsSyncing(false);
      setProgress(null);
    }
  }, [isSyncing, refreshStatus, selectedUserId]);

  return {
    sync,
    isSyncing,
    lastSyncTime,
    pendingCount,
    isConnected,
    isAuthenticated,
    error,
    progress,
    refreshStatus,
  };
};
