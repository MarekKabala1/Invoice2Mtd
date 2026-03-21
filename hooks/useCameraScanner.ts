import { useState } from "react";
import { launchDocumentScannerAsync, ResultFormatOptions, ScannerModeOptions } from "@infinitered/react-native-mlkit-document-scanner";
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { getOrCreateBillStorageDirectory } from '@/utils/permissions';


const DEFAULT_FILE_NAME = `Bill_${new Date().toISOString().split('T')[0]}.pdf`;

interface ScannedData {
  pages: string[];
  pdf?: string | null;
}

export const useCameraScanner = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [directoryUri, setDirectoryUri] = useState<string | null>(null);
  const handleScan = async (customFilename?: string) => {
    setIsLoading(true);
    try {
      const { canceled, pages, pdf } = await launchDocumentScannerAsync({
        pageLimit: 2,
        galleryImportAllowed: true,
        scannerMode: ScannerModeOptions.FULL,
        resultFormats: ResultFormatOptions.PDF
      });

      if (canceled) {
        setScannedData(null);
      } else {
        if (Platform.OS === 'android' && pdf?.uri) {
          const directoryUri = await getOrCreateBillStorageDirectory();
          setDirectoryUri(directoryUri);

          if (!directoryUri) {
            setScannedData({ pages: pages || [], pdf: null });
            return;
          }

          const base64 = await FileSystem.readAsStringAsync(pdf.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const filename = customFilename
            ? `${customFilename}.pdf`
            : `${DEFAULT_FILE_NAME}`;

          const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            filename,
            'application/pdf'
          );

          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        setScannedData({ pages: pages || [], pdf: pdf?.uri ?? null });
      }
    } catch (error) {
      console.error('Scanning failed:', error);
      setScannedData(null);
    } finally {
      setIsCameraOpen(false);
      setIsLoading(false);
    }
  };

  return { isCameraOpen, scannedData, handleScan, isLoading, directoryUri };
};