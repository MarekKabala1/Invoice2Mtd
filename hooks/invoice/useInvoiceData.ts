import { useLocalSearchParams } from 'expo-router';
import { InvoiceType, WorkInformationType, PaymentType } from '@/db/zodSchema';

interface ParsedInvoiceData {
  isUpdateMode: boolean;
  invoiceData?: InvoiceType;
  workItemsData: WorkInformationType[];
  paymentsData: PaymentType[];
  notes: Array<{ id: string; noteText: string }>;
}

export const useInvoiceData = (): ParsedInvoiceData => {
  const params = useLocalSearchParams();
  const isUpdateMode = params?.mode === 'update';

  const invoiceData = typeof params.invoice === 'string' ? JSON.parse(params.invoice) : params.invoice;

  const workItemsData = (() => {
    if (Array.isArray(params.workItems)) {
      return params.workItems.map((item) => (typeof item === 'string' ? JSON.parse(item) : item));
    }
    if (typeof params.workItems === 'string') {
      return JSON.parse(params.workItems);
    }
    return [];
  })();

  const paymentsData = (() => {
    if (Array.isArray(params.payments)) {
      return params.payments.map((item) => (typeof item === 'string' ? JSON.parse(item) : item));
    }
    if (typeof params.payments === 'string') {
      return JSON.parse(params.payments);
    }
    return [];
  })();

  let notes: Array<{ id: string; noteText: string }> = [];
  if (params.notes) {
    if (typeof params.notes === 'string') {
      try {
        notes = JSON.parse(params.notes);
      } catch {
        notes = JSON.parse(`[${params.notes}]`);
      }
    } else if (Array.isArray(params.notes)) {
      notes = params.notes.map((item) => (typeof item === 'string' ? JSON.parse(item) : item));
    }
  }

  return {
    isUpdateMode,
    invoiceData,
    workItemsData,
    paymentsData,
    notes,
  };
};