import { InvoiceForUpdate } from '@/types';

export interface GroupedInvoice {
  month: string;
  year: number;
  invoices: InvoiceForUpdate[];
}

export const groupInvoicesByMonth = (invoices: InvoiceForUpdate[]): GroupedInvoice[] => {
  const grouped = invoices.reduce((acc: { [key: string]: GroupedInvoice }, invoice) => {
    const date = new Date(invoice.invoiceDate);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const key = `${year}-${month}`;

    if (!acc[key]) {
      acc[key] = {
        month,
        year,
        invoices: [],
      };
    }

    acc[key].invoices.push(invoice);
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return new Date(b.month).getMonth() - new Date(a.month).getMonth();
  });
};