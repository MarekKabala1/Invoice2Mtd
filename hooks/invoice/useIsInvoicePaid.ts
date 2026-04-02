import { InvoiceType } from '@/db/zodSchema';

interface IsPayedReturn {
  isPayed: boolean;
}

export const useIsInvoicePaid = (invoiceData?: InvoiceType): IsPayedReturn => {
  return {
    isPayed: invoiceData?.isPayed || false
  };
};