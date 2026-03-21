import { InvoiceType, WorkInformationType, PaymentType, NoteType, CustomerType } from '@/db/zodSchema';


export type BankDetailsUpdateParams = {
  mode: 'update';
  type: 'bankDetails';
  userId: string;
  id: string;
  accountName?: string | undefined;
  sortCode?: string | undefined;
  accountNumber?: string | undefined;
  bankName?: string | undefined;
  createdAt?: string | undefined;
}

export type BankDetailsToUpdate = Omit<BankDetailsUpdateParams, 'mode' | 'type'>;

export type UserUpdateParams = {
  mode: 'update';
  type: 'user';
  id: string;
  fullName: string;
  address: string;
  emailAddress: string;
  phoneNumber?: string | undefined;
  utrNumber?: string | undefined;
  ninNumber?: string | undefined;
  createdAt?: string | undefined;
};

export type UserToUpdate = Omit<UserUpdateParams, 'mode' | 'type'>;

export interface InvoiceForUpdate extends InvoiceType {
  payments: PaymentType[];
  notes: NoteType[];
  workItems: WorkInformationType[];
  customer: CustomerType;
}