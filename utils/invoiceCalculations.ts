import { InvoiceType, WorkInformationType, PaymentType } from '@/db/zodSchema';

export const calculateInvoiceWorkItemTotals = (
  workItems: WorkInformationType[],
  taxRate: number,
  payments: PaymentType[] = [],
  taxValue: boolean = false
) => {
  const subtotal = workItems.reduce((sum, item) =>
    sum + (Number(item.unitPrice) || 0), 0);

  const totalPayments = payments.reduce((sum, payment) =>
    sum + (payment.amountPaid || 0), 0);

  const remainingBalance = subtotal - totalPayments;
  const tax = remainingBalance * (taxRate / 100);

  const total = taxValue ? remainingBalance + tax : remainingBalance - tax;

  return {
    subtotal,
    tax,
    total,
    remainingBalance,
  };
};

export const calculateInvoiceTotal = (
  invoices: InvoiceType[],
  payments: PaymentType[] = []
) => {
  const totals = invoices.reduce((acc, invoice) => ({
    totalBeforeTax: acc.totalBeforeTax + (invoice.amountBeforeTax || 0),
    totalAfterTax: acc.totalAfterTax + (invoice.amountAfterTax || 0),
  }), {
    totalBeforeTax: 0,
    totalAfterTax: 0,
  });

  const totalPayments = payments.reduce((sum, payment) =>
    sum + (payment.amountPaid || 0), 0);

  return {
    ...totals,
    totalAfterPayment: totals.totalBeforeTax - totalPayments,
    taxToPay: totals.totalAfterTax - totals.totalBeforeTax,
  };
};

export const calculateMonthlyTotals = (invoices: InvoiceType[]) => {
  return invoices.reduce((acc, invoice) => {
    let date: Date;
    try {
      date = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
      if (isNaN(date.getTime())) {
        date = new Date();
      }
    } catch {
      date = new Date();
    }
    const monthKey = date.toISOString().slice(0, 7);

    if (!acc[monthKey]) {
      acc[monthKey] = {
        totalBeforeTax: 0,
        totalAfterTax: 0,
        count: 0,
      };
    }

    acc[monthKey].totalBeforeTax += invoice.amountBeforeTax || 0;
    acc[monthKey].totalAfterTax += invoice.amountAfterTax || 0;
    acc[monthKey].count += 1;

    return acc;
  }, {} as Record<string, { totalBeforeTax: number; totalAfterTax: number; count: number }>);
};