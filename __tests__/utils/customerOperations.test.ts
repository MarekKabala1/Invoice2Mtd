import {
  getCustomers,
  getCustomerDetails,
  handleSaveCustomer,
  handleDeleteCustomer,
} from '@/utils/customerOperations';

// Mock the database module
jest.mock('@/db/config', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
  },
}));

// Mock the generateUuid module
jest.mock('@/utils/generateUuid', () => ({
  generateId: jest.fn().mockResolvedValue('mock-uuid-123'),
}));

describe('Customer Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should return all customers', async () => {
      const { db } = require('@/db/config');
      const mockCustomers = [
        {
          id: '1',
          name: 'ABC Company',
          address: '123 Main St',
          emailAddress: 'abc@example.com',
          phoneNumber: '1234567890',
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          name: 'XYZ Corp',
          address: '456 Oak Ave',
          emailAddress: 'xyz@example.com',
          phoneNumber: '0987654321',
          createdAt: '2024-01-02',
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockCustomers),
      });

      const result = await getCustomers();
      expect(result).toEqual(mockCustomers);
    });

    it('should return empty array on error', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await getCustomers();
      expect(result).toEqual([]);
    });

    it('should handle missing optional fields', async () => {
      const { db } = require('@/db/config');
      const mockCustomers = [
        {
          id: '1',
          name: null,
          address: null,
          emailAddress: null,
          phoneNumber: null,
          createdAt: null,
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockCustomers),
      });

      const result = await getCustomers();
      expect(result).toEqual([
        {
          id: '1',
          name: '',
          address: '',
          emailAddress: '',
          phoneNumber: '',
          createdAt: '',
        },
      ]);
    });
  });

  describe('getCustomerDetails', () => {
    it('should return customer details when customer exists', async () => {
      const { db } = require('@/db/config');
      const mockCustomer = [
        {
          id: '1',
          name: 'ABC Company',
          address: '123 Main St',
          emailAddress: 'abc@example.com',
          phoneNumber: '1234567890',
          createdAt: '2024-01-01',
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      const result = await getCustomerDetails('1');
      expect(result).toEqual(mockCustomer[0]);
    });

    it('should return null when customer does not exist', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await getCustomerDetails('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const { db } = require('@/db/config');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const result = await getCustomerDetails('1');
      expect(result).toBeNull();
    });

    it('should handle missing optional fields', async () => {
      const { db } = require('@/db/config');
      const mockCustomer = [
        {
          id: '1',
          name: null,
          address: null,
          emailAddress: null,
          phoneNumber: null,
          createdAt: null,
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      const result = await getCustomerDetails('1');
      expect(result).toEqual({
        id: '1',
        name: '',
        address: '',
        emailAddress: '',
        phoneNumber: '',
        createdAt: '',
      });
    });
  });

  describe('handleSaveCustomer', () => {
    it('should insert a new customer when not in update mode', async () => {
      const { db } = require('@/db/config');
      const customerData = {
        id: '',
        name: 'New Customer',
        address: '789 Pine St',
        emailAddress: 'new@example.com',
        phoneNumber: '5555555555',
        createdAt: '2024-01-03',
      };

      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([customerData]),
        }),
      });

      await handleSaveCustomer(customerData, false);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should update an existing customer when in update mode', async () => {
      const { db } = require('@/db/config');
      const customerData = {
        id: '1',
        name: 'Updated Customer',
        address: 'Updated Address',
        emailAddress: 'updated@example.com',
        phoneNumber: '6666666666',
        createdAt: '2024-01-01',
      };

      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await handleSaveCustomer(customerData, true, '1');
      expect(db.update).toHaveBeenCalled();
    });

    it('should throw an error when ID generation fails', async () => {
      const { generateId } = require('@/utils/generateUuid');
      generateId.mockResolvedValue('');

      const customerData = {
        id: '',
        name: 'New Customer',
        address: '789 Pine St',
        emailAddress: 'new@example.com',
        phoneNumber: '5555555555',
        createdAt: '2024-01-03',
      };

      await expect(handleSaveCustomer(customerData, false)).rejects.toThrow(
        'Failed to generate ID'
      );
    });

    it('should throw an error on database failure', async () => {
      const { db } = require('@/db/config');
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const customerData = {
        id: '',
        name: 'New Customer',
        address: '789 Pine St',
        emailAddress: 'new@example.com',
        phoneNumber: '5555555555',
        createdAt: '2024-01-03',
      };

      await expect(handleSaveCustomer(customerData, false)).rejects.toThrow();
    });
  });

  describe('handleDeleteCustomer', () => {
    it('should delete a customer', async () => {
      const { db } = require('@/db/config');
      db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      });

      await handleDeleteCustomer('1');
      expect(db.delete).toHaveBeenCalled();
    });

    it('should throw an error on database failure', async () => {
      const { db } = require('@/db/config');
      db.delete.mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(handleDeleteCustomer('1')).rejects.toThrow();
    });
  });
});