/**
 * permissions.ts
 *
 * Device permission helpers: media library access and per-type storage directory
 * management (invoice, estimate, bill).
 *
 * WHY: Storage directory functions were 3 near-identical copy-paste sets of 4 functions
 * each, differing only by AsyncStorage key and alert message. Parameterized into 4
 * generic functions with a StorageType config map.
 *
 * Depends on: expo-file-system, expo-media-library, @react-native-async-storage/async-storage
 * Used by: utils/invoice/pdfOperations.ts, hooks/shared/useCameraScanner.ts
 */

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { captureException } from '@/utils/shared/sentry';

export type StorageType = 'invoice' | 'estimate' | 'bill';

interface StorageConfig {
  key: string;
  label: string;
  alertNoun: string;
}

const STORAGE_CONFIG: Record<StorageType, StorageConfig> = {
  invoice: {
    key: 'invoice_storage_directory_uri',
    label: 'Invoice',
    alertNoun: 'invoice',
  },
  estimate: {
    key: 'estimate_storage_directory_uri',
    label: 'Estimate',
    alertNoun: 'estimate',
  },
  bill: {
    key: 'bill_storage_directory_uri',
    label: 'Bill',
    alertNoun: 'bill',
  },
};

export const requestMediaLibraryPermission = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Sorry, we need media library permissions to save the PDF');
    return false;
  }
  return true;
};

export const getOrCreateStorageDirectory = async (type: StorageType) => {
  const config = STORAGE_CONFIG[type];
  try {
    let directoryUri = await AsyncStorage.getItem(config.key);

    if (!directoryUri) {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        await AsyncStorage.setItem(config.key, permissions.directoryUri);
        directoryUri = permissions.directoryUri;
      } else {
        Alert.alert('Permission Denied', `Unable to save ${config.alertNoun} without storage access permission`);
        return null;
      }
    }

    return directoryUri;
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { action: `getting or creating ${config.alertNoun} storage directory` });
    return null;
  }
};

export const getStorageDirectory = async (type: StorageType) => {
  return await AsyncStorage.getItem(STORAGE_CONFIG[type].key);
};

export const requestStorageDirectory = async (type: StorageType) => {
  const config = STORAGE_CONFIG[type];
  try {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      await AsyncStorage.setItem(config.key, permissions.directoryUri);
      return permissions.directoryUri;
    } else {
      Alert.alert('Permission Denied', `Unable to save ${config.alertNoun} without storage access permission`);
      return null;
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { action: `requesting ${config.alertNoun} storage directory` });
    return null;
  }
};

export const resetStorageDirectory = async (type: StorageType) => {
  const config = STORAGE_CONFIG[type];
  await AsyncStorage.removeItem(config.key);
  Alert.alert('Success', `${config.label} storage directory has been reset. You will be prompted to select a new location next time you save a ${config.alertNoun}.`);
};

export const resetAllStorageDirectories = async () => {
  for (const config of Object.values(STORAGE_CONFIG)) {
    await AsyncStorage.removeItem(config.key);
  }
  Alert.alert('Success', 'All storage directories have been reset. You will be prompted to select new locations next time you save documents.');
};
