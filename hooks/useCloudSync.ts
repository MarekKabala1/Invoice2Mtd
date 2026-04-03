/**
 * useCloudSync.ts
 *
 * Hook for managing Supabase cloud sync from the app.
 * Provides sync status, pending count, and trigger sync functions.
 *
 * Used by: app/(drawer)/settings/sync.tsx, sync button components
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppSettings } from '@/context/AppSettingsContext';
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
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!selectedUserId) return;

    try {
      const status = await getSyncStatus(selectedUserId);
      setLastSyncTime(status.lastSync);
      setPendingCount(status.pendingCount);
      setIsConnected(status.isConnected);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get sync status');
    }
  }, [selectedUserId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!selectedUserId) {
      Alert.alert('Error', 'No user logged in');
      return null;
    }

    if (isSyncing) {
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

      await refreshStatus();

      if (result.failed > 0) {
        Alert.alert(
          'Sync Complete',
          `Synced: ${result.success}\nFailed: ${result.failed}`
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
  }, [selectedUserId, isSyncing, refreshStatus]);

  return {
    sync,
    isSyncing,
    lastSyncTime,
    pendingCount,
    isConnected,
    error,
    progress,
    refreshStatus,
  };
};
