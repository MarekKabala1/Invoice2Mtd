import {
  calculateInvoiceWorkItemTotals,
  calculateInvoiceTotal,
  calculateMonthlyTotals,
} from '@/utils/invoiceCalculations';

// Import actual types from the schema
import type { 
  WorkInformationType, 
  PaymentType, 
  InvoiceType 
} from '@/db/zodSchema';

describe('Invoice Calculations', () => {
  describe('calculateInvoiceWorkItemTotals', () => {
    it('should calculate subtotal from work items', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 100, 
          date: '2024-01-01',
          totalToPayMinusTax: 100,
          createdAt: '' 
        },
        { 
          id: '2', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 2', 
          unitPrice: 200, 
          date: '2024-01-01',
          totalToPayMinusTax: 200,
          createdAt: '' 
        },
        { 
          id: '3', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 3', 
          unitPrice: 50, 
          date: '2024-01-01',
          totalToPayMinusTax: 50,
          createdAt: '' 
        },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 20, [], false);

      expect(result.subtotal).toBe(350);
      expect(result.remainingBalance).toBe(350);
      expect(result.tax).toBe(70); // 20% of 350
      expect(result.total).toBe(280); // 350 - 70 (taxValue false)
    });

    it('should handle empty work items', () => {
      const workItems: WorkInformationType[] = [];

      const result = calculateInvoiceWorkItemTotals(workItems, 20, [], false);

      expect(result.subtotal).toBe(0);
      expect(result.remainingBalance).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should calculate payments correctly', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 300, 
          date: '2024-01-01',
          totalToPayMinusTax: 300,
          createdAt: '' 
        },
      ];

      const payments: PaymentType[] = [
        { id: 'p1', invoiceId: 'inv1', amountPaid: 100, paymentDate: '2024-01-02', createdAt: '' },
        { id: 'p2', invoiceId: 'inv1', amountPaid: 50, paymentDate: '2024-01-03', createdAt: '' },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 20, payments, false);

      expect(result.subtotal).toBe(300);
      expect(result.remainingBalance).toBe(150);
      expect(result.tax).toBe(30); // 20% of 150
      expect(result.total).toBe(120); // 150 - 30
    });

    it('should add tax when taxValue is true', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 200, 
          date: '2024-01-01',
          totalToPayMinusTax: 200,
          createdAt: '' 
        },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 10, [], true);

      expect(result.subtotal).toBe(200);
      expect(result.tax).toBe(20); // 10% of 200
      expect(result.total).toBe(220); // 200 + 20
    });

    it('should handle zero tax rate', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 100, 
          date: '2024-01-01',
          totalToPayMinusTax: 100,
          createdAt: '' 
        },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 0, [], false);

      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(100);
    });

    it('should handle invalid unitPrice', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: NaN, 
          date: '2024-01-01',
          totalToPayMinusTax: 0,
          createdAt: '' 
        },
        { 
          id: '2', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 2', 
          unitPrice: 100, 
          date: '2024-01-01',
          totalToPayMinusTax: 100,
          createdAt: '' 
        },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 10, [], false);

      expect(result.subtotal).toBe(100); // NaN is treated as 0
      expect(result.tax).toBe(10);
      expect(result.total).toBe(90);
    });

    it('should handle payments exceeding subtotal', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 100, 
          date: '2024-01-01',
          totalToPayMinusTax: 100,
          createdAt: '' 
        },
      ];

      const payments: PaymentType[] = [
        { id: 'p1', invoiceId: 'inv1', amountPaid: 150, paymentDate: '2024-01-02', createdAt: '' },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 10, payments, false);

      expect(result.subtotal).toBe(100);
      expect(result.remainingBalance).toBe(-50);
      expect(result.tax).toBe(-5); // 10% of -50
      expect(result.total).toBe(-45); // -50 - (-5)
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('should calculate totals from multiple invoices', () => {
      const invoices: InvoiceType[] = [
        { 
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
        },
        { 
          id: '2', 
          customerId: 'c2', 
          userId: 'u2', 
          invoiceDate: '2024-01-02', 
          dueDate: '2024-01-31', 
          amountAfterTax: 220, 
          amountBeforeTax: 200, 
          taxRate: 10, 
          taxValue: true, 
          createdAt: '2024-01-02', 
          isPayed: false,
          currency: 'GBP',
        },
      ];

      const payments: PaymentType[] = [
        { id: 'p1', invoiceId: '1', amountPaid: 50, paymentDate: '2024-01-15', createdAt: '' },
        { id: 'p2', invoiceId: '2', amountPaid: 100, paymentDate: '2024-01-15', createdAt: '' },
      ];

      const result = calculateInvoiceTotal(invoices, payments);

      expect(result.totalBeforeTax).toBe(300);
      expect(result.totalAfterTax).toBe(330);
      expect(result.totalAfterPayment).toBe(150); // 300 - 150
      expect(result.taxToPay).toBe(30); // 330 - 300
    });

    it('should handle empty invoices', () => {
      const result = calculateInvoiceTotal([], []);

      expect(result.totalBeforeTax).toBe(0);
      expect(result.totalAfterTax).toBe(0);
      expect(result.totalAfterPayment).toBe(0);
      expect(result.taxToPay).toBe(0);
    });

    it('should handle invoices with missing amounts', () => {
      const invoices: InvoiceType[] = [
        { 
          id: '1', 
          customerId: 'c1', 
          userId: 'u1', 
          invoiceDate: '2024-01-01', 
          dueDate: '2024-01-31', 
          amountAfterTax: 0, 
          amountBeforeTax: 0, 
          taxRate: 10, 
          taxValue: true, 
          createdAt: '2024-01-01', 
          isPayed: false,
          currency: 'GBP',
        },
      ];

      const result = calculateInvoiceTotal(invoices, []);

      expect(result.totalBeforeTax).toBe(0);
      expect(result.totalAfterTax).toBe(0);
    });
  });

  describe('calculateMonthlyTotals', () => {
    it('should group invoices by month', () => {
      const invoices: InvoiceType[] = [
        { 
          id: '1', 
          customerId: 'c1', 
          userId: 'u1', 
          invoiceDate: '2024-01-15', 
          dueDate: '2024-01-31', 
          amountAfterTax: 110, 
          amountBeforeTax: 100, 
          taxRate: 10, 
          taxValue: true, 
          createdAt: '2024-01-15', 
          isPayed: false,
          currency: 'GBP',
        },
        { 
          id: '2', 
          customerId: 'c2', 
          userId: 'u2', 
          invoiceDate: '2024-01-20', 
          dueDate: '2024-01-31', 
          amountAfterTax: 220, 
          amountBeforeTax: 200, 
          taxRate: 10, 
          taxValue: true, 
          createdAt: '2024-01-20', 
          isPayed: false,
          currency: 'GBP',
        },
        { 
          id: '3', 
          customerId: 'c3', 
          userId: 'u3', 
          invoiceDate: '2024-02-05', 
          dueDate: '2024-02-29', 
          amountAfterTax: 165, 
          amountBeforeTax: 150, 
          taxRate: 10, 
          taxValue: true, 
          createdAt: '2024-02-05', 
          isPayed: false,
          currency: 'GBP',
        },
      ];

      const result = calculateMonthlyTotals(invoices);

      expect(result['2024-01']).toBeDefined();
      expect(result['2024-01'].totalBeforeTax).toBe(300);
      expect(result['2024-01'].totalAfterTax).toBe(330);
      expect(result['2024-01'].count).toBe(2);

      expect(result['2024-02']).toBeDefined();
      expect(result['2024-02'].totalBeforeTax).toBe(150);
      expect(result['2024-02'].totalAfterTax).toBe(165);
      expect(result['2024-02'].count).toBe(1);
    });

    it('should handle empty invoices', () => {
      const result = calculateMonthlyTotals([]);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle invoices with missing createdAt', () => {
      const invoices: InvoiceType[] = [
        { 
          id: '1', 
          customerId: 'c1', 
          userId: 'u1', 
          invoiceDate: '2024-01-01', 
          dueDate: '2024-01-31', 
          amountAfterTax: 110, 
          amountBeforeTax: 100, 
          taxRate: 10, 
          taxValue: true, 
          createdAt: '', 
          isPayed: false,
          currency: 'GBP',
        },
      ];

      // Should not throw, should use current date as fallback
      expect(() => calculateMonthlyTotals(invoices)).not.toThrow();
    });

    it('should handle invoices with invalid dates', () => {
      const invoices: InvoiceType[] = [
        { 
          id: '1', 
          customerId: 'c1', 
          userId: 'u1', 
          invoiceDate: '2024-01-01', 
          dueDate: '2024-01-31', 
          amountAfterTax: 110, 
          amountBeforeTax: 100, 
          taxRate: 10, 
          taxValue: true, 
          createdAt: 'invalid-date', 
          isPayed: false,
          currency: 'GBP',
        },
      ];

      // Should not throw
      expect(() => calculateMonthlyTotals(invoices)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 1000000000, 
          date: '2024-01-01',
          totalToPayMinusTax: 1000000000,
          createdAt: '' 
        },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 10, [], false);

      expect(result.subtotal).toBe(1000000000);
      expect(result.tax).toBe(100000000);
      expect(result.total).toBe(900000000);
    });

    it('should handle decimal numbers', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 100.50, 
          date: '2024-01-01',
          totalToPayMinusTax: 100.50,
          createdAt: '' 
        },
        { 
          id: '2', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 2', 
          unitPrice: 50.25, 
          date: '2024-01-01',
          totalToPayMinusTax: 50.25,
          createdAt: '' 
        },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 10, [], false);

      expect(result.subtotal).toBe(150.75);
      expect(result.tax).toBeCloseTo(15.075, 3);
      expect(result.total).toBeCloseTo(135.675, 3);
    });

    it('should handle negative unitPrice (credit)', () => {
      const workItems: WorkInformationType[] = [
        { 
          id: '1', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Item 1', 
          unitPrice: 100, 
          date: '2024-01-01',
          totalToPayMinusTax: 100,
          createdAt: '' 
        },
        { 
          id: '2', 
          invoiceId: 'inv1', 
          descriptionOfWork: 'Discount', 
          unitPrice: -20, 
          date: '2024-01-01',
          totalToPayMinusTax: -20,
          createdAt: '' 
        },
      ];

      const result = calculateInvoiceWorkItemTotals(workItems, 10, [], false);

      expect(result.subtotal).toBe(80);
      expect(result.tax).toBe(8);
      expect(result.total).toBe(72);
    });
  });
});