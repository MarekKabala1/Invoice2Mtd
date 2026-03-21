import { z } from 'zod';
import {
  userSchema,
  bankDetailsSchema,
  customerSchema,
  workInformationSchema,
  invoiceSchema,
  paymentSchema,
  noteSchema,
  categorySchema,
  transactionSchema,
  appSettingsSchema,
} from '@/db/zodSchema';

describe('Form Validation Schemas', () => {
  describe('userSchema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        id: 'user-123',
        fullName: 'John Doe',
        address: '123 Main St',
        emailAddress: 'john@example.com',
        phoneNumber: '1234567890',
        utrNumber: 'UTR123',
        ninNumber: 'NIN456',
        createdAt: '2024-01-01',
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should require fullName with minimum length', () => {
      const userWithShortName = {
        id: 'user-123',
        fullName: 'J',
        address: '123 Main St',
        emailAddress: 'john@example.com',
      };

      const result = userSchema.safeParse(userWithShortName);
      expect(result.success).toBe(false);
    });

    it('should require valid email format', () => {
      const userWithInvalidEmail = {
        id: 'user-123',
        fullName: 'John Doe',
        address: '123 Main St',
        emailAddress: 'invalid-email',
      };

      const result = userSchema.safeParse(userWithInvalidEmail);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields', () => {
      const minimalUser = {
        id: 'user-123',
        fullName: 'John Doe',
        address: '123 Main St',
        emailAddress: 'john@example.com',
      };

      const result = userSchema.safeParse(minimalUser);
      expect(result.success).toBe(true);
    });

    it('should validate with optional isAdmin field', () => {
      const adminUser = {
        id: 'user-123',
        fullName: 'Admin User',
        address: '123 Main St',
        emailAddress: 'admin@example.com',
        isAdmin: true,
      };

      const result = userSchema.safeParse(adminUser);
      expect(result.success).toBe(true);
    });
  });

  describe('customerSchema', () => {
    it('should validate valid customer data', () => {
      const validCustomer = {
        id: 'customer-123',
        name: 'ABC Company',
        address: '456 Business Ave',
        emailAddress: 'contact@abc.com',
        phoneNumber: '9876543210',
        createdAt: '2024-01-01',
      };

      const result = customerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should require name with minimum length', () => {
      const customerWithShortName = {
        id: 'customer-123',
        name: 'A',
        emailAddress: 'contact@abc.com',
      };

      const result = customerSchema.safeParse(customerWithShortName);
      expect(result.success).toBe(false);
    });

    it('should require valid email format', () => {
      const customerWithInvalidEmail = {
        id: 'customer-123',
        name: 'ABC Company',
        emailAddress: 'invalid-email',
      };

      const result = customerSchema.safeParse(customerWithInvalidEmail);
      expect(result.success).toBe(false);
    });

    it('should allow optional id', () => {
      const customerWithoutId = {
        name: 'ABC Company',
        emailAddress: 'contact@abc.com',
      };

      const result = customerSchema.safeParse(customerWithoutId);
      expect(result.success).toBe(true);
    });
  });

  describe('invoiceSchema', () => {
    it('should validate valid invoice data', () => {
      const validInvoice = {
        id: 'inv-123',
        userId: 'user-123',
        customerId: 'customer-123',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountAfterTax: 110,
        amountBeforeTax: 100,
        taxRate: 10,
        currency: 'GBP',
        taxValue: false,
        isPayed: false,
      };

      const result = invoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('should require userId', () => {
      const invoiceWithoutUser = {
        id: 'inv-123',
        customerId: 'customer-123',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountAfterTax: 110,
        amountBeforeTax: 100,
        taxRate: 10,
      };

      const result = invoiceSchema.safeParse(invoiceWithoutUser);
      expect(result.success).toBe(false);
    });

    it('should require customerId', () => {
      const invoiceWithoutCustomer = {
        id: 'inv-123',
        userId: 'user-123',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountAfterTax: 110,
        amountBeforeTax: 100,
        taxRate: 10,
      };

      const result = invoiceSchema.safeParse(invoiceWithoutCustomer);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields', () => {
      const invoiceWithOptional = {
        id: 'inv-123',
        userId: 'user-123',
        customerId: 'customer-123',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountAfterTax: 110,
        amountBeforeTax: 100,
        taxRate: 10,
        pdfPath: '/path/to/invoice.pdf',
        discount: 5,
      };

      const result = invoiceSchema.safeParse(invoiceWithOptional);
      expect(result.success).toBe(true);
    });
  });

  describe('transactionSchema', () => {
    it('should validate valid transaction data', () => {
      const validTransaction = {
        id: 'trans-123',
        categoryId: 'cat-456',
        userId: 'user-123',
        amount: 150.50,
        date: '2024-01-15',
        description: 'Office supplies',
        type: 'EXPENSE' as const,
        currency: 'GBP',
      };

      const result = transactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('should require positive amount', () => {
      const transactionWithNegativeAmount = {
        id: 'trans-123',
        categoryId: 'cat-456',
        userId: 'user-123',
        amount: -50,
        date: '2024-01-15',
      };

      const result = transactionSchema.safeParse(transactionWithNegativeAmount);
      expect(result.success).toBe(false);
    });

    it('should require valid type enum', () => {
      const transactionWithInvalidType = {
        id: 'trans-123',
        categoryId: 'cat-456',
        userId: 'user-123',
        amount: 100,
        date: '2024-01-15',
        type: 'INVALID',
      };

      const result = transactionSchema.safeParse(transactionWithInvalidType);
      expect(result.success).toBe(false);
    });

    it('should validate INCOME type', () => {
      const incomeTransaction = {
        id: 'trans-123',
        categoryId: 'cat-456',
        userId: 'user-123',
        amount: 1000,
        date: '2024-01-15',
        type: 'INCOME' as const,
      };

      const result = transactionSchema.safeParse(incomeTransaction);
      expect(result.success).toBe(true);
    });

    it('should default description to empty string', () => {
      const transactionWithoutDescription = {
        id: 'trans-123',
        categoryId: 'cat-456',
        userId: 'user-123',
        amount: 100,
        date: '2024-01-15',
      };

      const result = transactionSchema.safeParse(transactionWithoutDescription);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });
  });

  describe('paymentSchema', () => {
    it('should validate valid payment data', () => {
      const validPayment = {
        id: 'pay-123',
        invoiceId: 'inv-123',
        paymentDate: '2024-01-20',
        amountPaid: 500,
        createdAt: '2024-01-20',
      };

      const result = paymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('should require amountPaid', () => {
      const paymentWithoutAmount = {
        id: 'pay-123',
        invoiceId: 'inv-123',
        paymentDate: '2024-01-20',
      };

      const result = paymentSchema.safeParse(paymentWithoutAmount);
      expect(result.success).toBe(false);
    });
  });

  describe('categorySchema', () => {
    it('should validate valid category data', () => {
      const validCategory = {
        id: 'cat-123',
        name: 'Office Supplies',
        type: 'EXPENSE',
      };

      const result = categorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it('should require all fields', () => {
      const categoryWithoutName = {
        id: 'cat-123',
        type: 'EXPENSE',
      };

      const result = categorySchema.safeParse(categoryWithoutName);
      expect(result.success).toBe(false);
    });
  });

  describe('appSettingsSchema', () => {
    it('should validate with defaults', () => {
      const result = appSettingsSchema.safeParse({});
      if (result.success) {
        expect(result.data.defaultPaymentTerms).toBe(30);
        expect(result.data.defaultVatRate).toBe(20);
        expect(result.data.invoicePrefix).toBe('INV');
        expect(result.data.currency).toBe('GBP');
      }
    });

    it('should validate complete settings', () => {
      const fullSettings = {
        id: 1,
        userId: 'user-123',
        defaultPaymentTerms: 45,
        defaultVatRate: 15,
        invoicePrefix: 'INV-',
        nextInvoiceNumber: 100,
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'dark',
      };

      const result = appSettingsSchema.safeParse(fullSettings);
      expect(result.success).toBe(true);
    });

    it('should validate boolean fields', () => {
      const settingsWithBooleans = {
        autoCalculateQuarters: false,
        quarterlyTaxEnabled: true,
        reminderEmailEnabled: false,
      };

      const result = appSettingsSchema.safeParse(settingsWithBooleans);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects for schemas with defaults', () => {
      const result = appSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject null values for required fields', () => {
      const userWithNullEmail = {
        id: 'user-123',
        fullName: 'John Doe',
        address: '123 Main St',
        emailAddress: null,
      };

      const result = userSchema.safeParse(userWithNullEmail);
      expect(result.success).toBe(false);
    });

    it('should handle extra properties', () => {
      const userWithExtra = {
        id: 'user-123',
        fullName: 'John Doe',
        address: '123 Main St',
        emailAddress: 'john@example.com',
        extraField: 'should be ignored',
      };

      const result = userSchema.safeParse(userWithExtra);
      expect(result.success).toBe(true);
    });
  });
});