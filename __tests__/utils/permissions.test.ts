import {
  requestMediaLibraryPermission,
  getOrCreateInvoiceStorageDirectory,
  resetInvoiceStorageDirectory,
  getInvoiceStorageDirectory,
  getEstimateStorageDirectory,
  requestInvoiceStorageDirectory,
  requestEstimateStorageDirectory,
} from '@/utils/permissions';

// Alias for backward compatibility
const getOrCreateStorageDirectory = getOrCreateInvoiceStorageDirectory;
const resetStorageDirectory = resetInvoiceStorageDirectory;

// Mock expo modules
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

jest.mock('expo-file-system', () => ({
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn().mockResolvedValue({
      granted: true,
      directoryUri: 'dir://storage',
    }),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestMediaLibraryPermission', () => {
    it('should return true when permission is granted', async () => {
      const MediaLibrary = require('expo-media-library');
      MediaLibrary.requestPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
      });

      const result = await requestMediaLibraryPermission();
      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      const { Alert } = require('react-native');
      const MediaLibrary = require('expo-media-library');
      MediaLibrary.requestPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
      });

      const result = await requestMediaLibraryPermission();
      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Required',
        expect.stringContaining('media library permissions')
      );
    });
  });

  describe('getOrCreateStorageDirectory', () => {
    it('should return cached directory URI if it exists', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce('dir://cached');

      const result = await getOrCreateStorageDirectory();
      expect(result).toBe('dir://cached');
    });

    it('should request directory permissions if no cached URI', async () => {
      const FileSystem = require('expo-file-system');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      AsyncStorage.getItem.mockResolvedValueOnce(null);
      FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync.mockResolvedValueOnce(
        {
          granted: true,
          directoryUri: 'dir://new',
        }
      );

      const result = await getOrCreateStorageDirectory();
      expect(result).toBe('dir://new');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'invoice_storage_directory_uri',
        'dir://new'
      );
    });

    it('should return null when directory permission is denied', async () => {
      const { Alert } = require('react-native');
      const FileSystem = require('expo-file-system');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      AsyncStorage.getItem.mockResolvedValueOnce(null);
      FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync.mockResolvedValueOnce(
        {
          granted: false,
        }
      );

      const result = await getOrCreateStorageDirectory();
      expect(result).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Denied',
        expect.stringContaining('storage access permission')
      );
    });

    it('should return null on error', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await getOrCreateStorageDirectory();
      expect(result).toBeNull();
    });
  });

  describe('resetStorageDirectory', () => {
    it('should remove cached directory URI and show success alert', async () => {
      const { Alert } = require('react-native');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      await resetStorageDirectory();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'invoice_storage_directory_uri'
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        expect.stringContaining('Invoice storage directory has been reset')
      );
    });
  });
});