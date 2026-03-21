// Mock expo modules first
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://documents/',
  cacheDirectory: 'file://cache/',
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

// Mock the database module
jest.mock('@/db/config', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  },
}));

// Mock other dependencies
jest.mock('@/utils/generateUuid', () => ({
  generateId: jest.fn().mockResolvedValue('mock-uuid-123'),
}));

jest.mock('@/utils/invoiceCalculations', () => ({
  calculateInvoiceWorkItemTotals: jest.fn().mockReturnValue({
    subtotal: 100,
    tax: 20,
    total: 120,
    remainingBalance: 100,
  }),
}));

jest.mock('@/utils/pdfOperations', () => ({
  generateAndSavePdf: jest.fn(),
}));

jest.mock('@/utils/customerOperations', () => ({
  getCustomers: jest.fn(),
  getCustomerDetails: jest.fn(),
}));

import {
  getNextSequentialInvoiceId,
  getUsers,
  getUserAndBankDetails,
} from '@/utils/invoiceFormOperations';

describe('Invoice Form Operations', () => {
  describe('getNextSequentialInvoiceId', () => {
    it('should return "1" when there are no invoices', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await getNextSequentialInvoiceId();
      expect(result).toBe('1');
    });

    it('should return the next sequential ID based on existing invoices', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([
          { id: '1' },
          { id: '2' },
          { id: '5' },
        ]),
      });

      const result = await getNextSequentialInvoiceId();
      expect(result).toBe('6');
    });

    it('should handle non-numeric invoice IDs gracefully', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([
          { id: 'INV-001' },
          { id: 'INV-002' },
        ]),
      });

      const result = await getNextSequentialInvoiceId();
      expect(result).toBe('1');
    });

    it('should return "1" on error', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await getNextSequentialInvoiceId();
      expect(result).toBe('1');
    });
  });

  describe('getUsers', () => {
    it('should return all users when not in update mode', async () => {
      const { db } = require('@/db/config');
      const mockUsers = [
        { id: '1', fullName: 'John Doe' },
        { id: '2', fullName: 'Jane Smith' },
      ];
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await getUsers(false);
      expect(result).toEqual([
        { label: 'John Doe', value: '1' },
        { label: 'Jane Smith', value: '2' },
      ]);
    });

    it('should return specific user when in update mode with userId', async () => {
      const { db } = require('@/db/config');
      const mockUsers = [
        { id: '1', fullName: 'John Doe' },
        { id: '2', fullName: 'Jane Smith' },
      ];
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockUsers[0]]),
        }),
      });

      const result = await getUsers(true, '1');
      expect(result).toEqual([{ label: 'John Doe', value: '1' }]);
    });

    it('should handle empty fullName', async () => {
      const { db } = require('@/db/config');
      const mockUsers = [{ id: '1', fullName: '' }];
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await getUsers(false);
      expect(result).toEqual([{ label: 'Unnamed User', value: '1' }]);
    });
  });

  describe('getUserAndBankDetails', () => {
    it('should return user and bank details when they exist', async () => {
      const { db } = require('@/db/config');
      const mockUser = [
        {
          id: '1',
          fullName: 'John Doe',
          emailAddress: 'john@example.com',
          address: '123 Main St',
          phoneNumber: '1234567890',
          utrNumber: 'UTR123',
          ninNumber: 'NIN456',
          createdAt: '2024-01-01',
        },
      ];
      const mockBankDetails = [
        {
          id: 'bd1',
          userId: '1',
          accountName: 'John Doe',
          sortCode: '12-34-56',
          accountNumber: '12345678',
          bankName: 'Test Bank',
          createdAt: '2024-01-01',
        },
      ];

      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockUser),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockBankDetails),
          }),
        });

      const result = await getUserAndBankDetails('1');
      expect(result.userDetails).toEqual({
        id: '1',
        fullName: 'John Doe',
        emailAddress: 'john@example.com',
        address: '123 Main St',
        phoneNumber: '1234567890',
        utrNumber: 'UTR123',
        ninNumber: 'NIN456',
        createdAt: '2024-01-01',
      });
      expect(result.bankDetails).toEqual({
        id: 'bd1',
        userId: '1',
        accountName: 'John Doe',
        sortCode: '12-34-56',
        accountNumber: '12345678',
        bankName: 'Test Bank',
        createdAt: '2024-01-01',
      });
    });

    it('should return null for bank details when they do not exist', async () => {
      const { db } = require('@/db/config');
      const mockUser = [
        {
          id: '1',
          fullName: 'John Doe',
          emailAddress: 'john@example.com',
          address: '123 Main St',
          phoneNumber: '1234567890',
          utrNumber: 'UTR123',
          ninNumber: 'NIN456',
          createdAt: '2024-01-01',
        },
      ];

      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockUser),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const result = await getUserAndBankDetails('1');
      expect(result.userDetails).not.toBeNull();
      expect(result.bankDetails).toBeNull();
    });

    it('should return null for both when user does not exist', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await getUserAndBankDetails('nonexistent');
      expect(result.userDetails).toBeNull();
      expect(result.bankDetails).toBeNull();
    });

    it('should handle missing optional fields', async () => {
      const { db } = require('@/db/config');
      const mockUser = [
        {
          id: '1',
          fullName: null,
          emailAddress: null,
          address: null,
          phoneNumber: null,
          utrNumber: null,
          ninNumber: null,
          createdAt: null,
        },
      ];

      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockUser),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const result = await getUserAndBankDetails('1');
      expect(result.userDetails).toEqual({
        id: '1',
        fullName: 'Unnamed User',
        emailAddress: '',
        address: '',
        phoneNumber: '',
        utrNumber: '',
        ninNumber: '',
        createdAt: '',
      });
    });
  });
});