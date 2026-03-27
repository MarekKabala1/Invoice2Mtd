import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const INVOICE_STORAGE_DIRECTORY_URI_KEY = 'invoice_storage_directory_uri';
const ESTIMATE_STORAGE_DIRECTORY_URI_KEY = 'estimate_storage_directory_uri';
const BILL_STORAGE_DIRECTORY_URI_KEY = 'bill_storage_directory_uri';

export const requestMediaLibraryPermission = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Sorry, we need media library permissions to save the PDF');
    return false;
  }
  return true;
};

export const getOrCreateInvoiceStorageDirectory = async () => {
  try {
    let directoryUri = await AsyncStorage.getItem(INVOICE_STORAGE_DIRECTORY_URI_KEY);

    if (!directoryUri) {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        await AsyncStorage.setItem(INVOICE_STORAGE_DIRECTORY_URI_KEY, permissions.directoryUri);
        directoryUri = permissions.directoryUri;
      } else {
        Alert.alert('Permission Denied', 'Unable to save invoice without storage access permission');
        return null;
      }
    }

    return directoryUri;
  } catch (error) {
    console.error('Error getting or creating invoice storage directory:', error);
    return null;
  }
};

export const getOrCreateEstimateStorageDirectory = async () => {
  try {
    let directoryUri = await AsyncStorage.getItem(ESTIMATE_STORAGE_DIRECTORY_URI_KEY);

    if (!directoryUri) {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        await AsyncStorage.setItem(ESTIMATE_STORAGE_DIRECTORY_URI_KEY, permissions.directoryUri);
        directoryUri = permissions.directoryUri;
      } else {
        Alert.alert('Permission Denied', 'Unable to save estimate without storage access permission');
        return null;
      }
    }

    return directoryUri;
  } catch (error) {
    console.error('Error getting or creating estimate storage directory:', error);
    return null;
  }
};

export const getInvoiceStorageDirectory = async () => {
  return await AsyncStorage.getItem(INVOICE_STORAGE_DIRECTORY_URI_KEY);
};

export const getEstimateStorageDirectory = async () => {
  return await AsyncStorage.getItem(ESTIMATE_STORAGE_DIRECTORY_URI_KEY);
};

export const requestInvoiceStorageDirectory = async () => {
  try {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      await AsyncStorage.setItem(INVOICE_STORAGE_DIRECTORY_URI_KEY, permissions.directoryUri);
      return permissions.directoryUri;
    } else {
      Alert.alert('Permission Denied', 'Unable to save invoice without storage access permission');
      return null;
    }
  } catch (error) {
    console.error('Error requesting invoice storage directory:', error);
    return null;
  }
};

export const requestEstimateStorageDirectory = async () => {
  try {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      await AsyncStorage.setItem(ESTIMATE_STORAGE_DIRECTORY_URI_KEY, permissions.directoryUri);
      return permissions.directoryUri;
    } else {
      Alert.alert('Permission Denied', 'Unable to save estimate without storage access permission');
      return null;
    }
  } catch (error) {
    console.error('Error requesting estimate storage directory:', error);
    return null;
  }
};

export const resetInvoiceStorageDirectory = async () => {
  await AsyncStorage.removeItem(INVOICE_STORAGE_DIRECTORY_URI_KEY);
  Alert.alert('Success', 'Invoice storage directory has been reset. You will be prompted to select a new location next time you save an invoice.');
};

export const resetEstimateStorageDirectory = async () => {
  await AsyncStorage.removeItem(ESTIMATE_STORAGE_DIRECTORY_URI_KEY);
  Alert.alert('Success', 'Estimate storage directory has been reset. You will be prompted to select a new location next time you save an estimate.');
};

export const resetAllStorageDirectories = async () => {
  await AsyncStorage.removeItem(INVOICE_STORAGE_DIRECTORY_URI_KEY);
  await AsyncStorage.removeItem(ESTIMATE_STORAGE_DIRECTORY_URI_KEY);
  await AsyncStorage.removeItem(BILL_STORAGE_DIRECTORY_URI_KEY);
  Alert.alert('Success', 'All storage directories have been reset. You will be prompted to select new locations next time you save documents.');
};

export const getOrCreateBillStorageDirectory = async () => {
  try {
    let directoryUri = await AsyncStorage.getItem(BILL_STORAGE_DIRECTORY_URI_KEY);

    if (!directoryUri) {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        await AsyncStorage.setItem(BILL_STORAGE_DIRECTORY_URI_KEY, permissions.directoryUri);
        directoryUri = permissions.directoryUri;
      } else {
        Alert.alert('Permission Denied', 'Unable to save bill without storage access permission');
        return null;
      }
    }

    return directoryUri;
  } catch (error) {
    console.error('Error getting or creating bill storage directory:', error);
    return null;
  }
};

export const getBillStorageDirectory = async () => {
  return await AsyncStorage.getItem(BILL_STORAGE_DIRECTORY_URI_KEY);
};

export const requestBillStorageDirectory = async () => {
  try {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      await AsyncStorage.setItem(BILL_STORAGE_DIRECTORY_URI_KEY, permissions.directoryUri);
      return permissions.directoryUri;
    } else {
      Alert.alert('Permission Denied', 'Unable to save bill without storage access permission');
      return null;
    }
  } catch (error) {
    console.error('Error requesting bill storage directory:', error);
    return null;
  }
};

export const resetBillStorageDirectory = async () => {
  await AsyncStorage.removeItem(BILL_STORAGE_DIRECTORY_URI_KEY);
  Alert.alert('Success', 'Bill storage directory has been reset. You will be prompted to select a new location next time you scan a bill.');
};

// Legacy functions for backward compatibility
export const getOrCreateStorageDirectory = getOrCreateInvoiceStorageDirectory;
export const resetStorageDirectory = resetInvoiceStorageDirectory;
