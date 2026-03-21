import { generateAndSavePdf } from '@/utils/pdfOperations';

// Mock expo modules
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file://temp.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://documents/',
  cacheDirectory: 'file://cache/',
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    Base64: 'base64',
  },
  StorageAccessFramework: {
    createFileAsync: jest.fn().mockResolvedValue('file://new.pdf'),
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('@/utils/permissions', () => ({
  requestMediaLibraryPermission: jest.fn().mockResolvedValue(true),
  getOrCreateStorageDirectory: jest.fn().mockResolvedValue('dir://storage'),
  resetStorageDirectory: jest.fn().mockResolvedValue(undefined),
}));

describe('PDF Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAndSavePdf', () => {
    const mockParams = {
      data: {
        id: '1',
        customerId: 'c1',
        userId: 'u1',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountAfterTax: 110,
        amountBeforeTax: 100,
        taxRate: 10,
        taxValue: true,
        createdAt: '2024-01-01',
        isPayed: false,
        currency: 'GBP',
        workItems: [],
        payments: [],
        user: {
          id: 'u1',
          fullName: 'Test User',
          address: '123 Main St',
          emailAddress: 'test@example.com',
          phoneNumber: '1234567890',
          utrNumber: 'UTR123',
          ninNumber: 'NIN456',
          createdAt: '2024-01-01',
        },
        customer: {
          id: 'c1',
          name: 'Test Customer',
          address: '456 Oak Ave',
          emailAddress: 'customer@example.com',
          phoneNumber: '0987654321',
          createdAt: '2024-01-01',
        },
        bankDetails: {
          id: 'bd1',
          userId: 'u1',
          accountName: 'Test User',
          sortCode: '12-34-56',
          accountNumber: '12345678',
          bankName: 'Test Bank',
          createdAt: '2024-01-01',
        },
        notes: 'Test notes',
      },
      tax: 10,
      subtotal: 100,
      total: 110,
      remainingBalance: 100,
    };

    it('should return false when permission is not granted', async () => {
      const { requestMediaLibraryPermission } = require('@/utils/permissions');
      requestMediaLibraryPermission.mockResolvedValueOnce(false);

      const result = await generateAndSavePdf(mockParams);
      expect(result).toBe(false);
    });

    it('should generate PDF on iOS and share it', async () => {
      const { Alert } = require('react-native');
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');
      const FileSystem = require('expo-file-system');

      const result = await generateAndSavePdf(mockParams);

      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(FileSystem.copyAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'PDF has been shared');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const { Alert } = require('react-native');
      const Print = require('expo-print');
      Print.printToFileAsync.mockRejectedValueOnce(new Error('Print error'));

      const result = await generateAndSavePdf(mockParams);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        expect.stringContaining('Failed to generate or save PDF')
      );
      expect(result).toBe(false);
    });
  });
});