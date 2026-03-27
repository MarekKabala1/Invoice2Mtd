/**
 * useInvoiceListData.ts
 *
 * Fetches all invoice-related data (invoices, payments, notes, work items, customers)
 * in parallel and maps them to typed objects. Provides grouped/sectioned invoice data.
 *
 * WHY: InvoiceList.tsx ran 5 parallel DB queries inline with manual type mapping.
 *      Extracting to a hook improves testability and follows the architecture pattern
 *      where all DB access goes through hooks.
 *
 * Depends on: db/config, db/schema, utils/invoiceFinancialGrouping, context/AppSettingsContext
 * Used by: components/InvoiceForm/InvoiceList.tsx
 */

import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { db } from '@/db/config';
import { Invoice, Payment, Note, WorkInformation, Customer } from '@/db/schema';
import { InvoiceType, WorkInformationType, PaymentType, NoteType, CustomerType } from '@/db/zodSchema';
import { InvoiceForUpdate } from '@/types';
import { groupInvoicesByFinancialYearAndQuarter } from '@/utils/invoice/invoiceFinancialGrouping';
import { useAppSettings } from '@/context/AppSettingsContext';

interface InvoiceListData {
	invoices: InvoiceType[];
	payments: PaymentType[];
	notes: NoteType[];
	workItems: WorkInformationType[];
	customers: CustomerType[];
}

const emptyData: InvoiceListData = {
	invoices: [],
	payments: [],
	notes: [],
	workItems: [],
	customers: [],
};

export function useInvoiceListData() {
	const [data, setData] = useState<InvoiceListData>(emptyData);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { settings } = useAppSettings();

	const loadData = useCallback(async () => {
		setIsLoading(true);
		let invoicesData: any[] = [];
		let paymentsData: any[] = [];
		let notesData: any[] = [];
		let workItemsData: any[] = [];
		let customersData: any[] = [];

		try {
			[invoicesData, paymentsData, notesData, workItemsData, customersData] = await Promise.all([
				db.select().from(Invoice),
				db.select().from(Payment),
				db.select().from(Note),
				db.select().from(WorkInformation),
				db.select().from(Customer),
			]);
		} catch (e) {
			console.error('Failed to load invoice tables:', e);
		}

		try {
			setData({
				invoices: invoicesData.map((invoice) => ({
					...invoice,
					userId: invoice?.userId!,
					customerId: invoice.customerId!,
					invoiceDate: invoice.invoiceDate!,
					dueDate: invoice.dueDate!,
					amountAfterTax: invoice.amountAfterTax!,
					amountBeforeTax: invoice.amountBeforeTax!,
					taxRate: invoice.taxRate!,
					pdfPath: invoice.pdfPath!,
					createdAt: invoice.createdAt!,
					currency: 'GBP',
					taxValue: invoice.taxValue!,
					isPayed: invoice.isPayed!,
					discount: invoice.discount!,
				})),
				payments: paymentsData.map((payment) => ({
					...payment,
					invoiceId: payment.invoiceId ?? '',
					paymentDate: payment.paymentDate ?? '',
					amountPaid: payment.amountPaid ?? 0,
					createdAt: payment.createdAt ?? '',
				})),
				notes: notesData.map((note) => ({
					...note,
					invoiceId: note.invoiceId!,
					noteDate: note.noteDate!,
					noteText: note.noteText ?? 'No text',
					createdAt: note.createdAt!,
				})),
				workItems: workItemsData.map((workItem) => ({
					...workItem,
					invoiceId: workItem.invoiceId ?? '',
					descriptionOfWork: workItem.descriptionOfWork ?? 'No description',
					unitPrice: workItem.unitPrice ?? 0,
					date: workItem.date ?? '',
					totalToPayMinusTax: workItem.totalToPayMinusTax ?? 0,
					createdAt: workItem.createdAt ?? '',
				})),
				customers: customersData.map((customer) => ({
					...customer,
					emailAddress: customer.emailAddress ?? '',
					name: customer.name ?? '',
					id: customer.id,
					address: customer.address ?? undefined,
					phoneNumber: customer.phoneNumber ?? undefined,
					createdAt: customer.createdAt ?? '',
				})),
			});
		} catch (err) {
			console.error('Error loading data:', err);
			setError('Failed to load data');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	const memoizedInvoices = useMemo((): InvoiceForUpdate[] => {
		return data.invoices
			.map((invoice) => {
				const invoicePayments = data.payments.filter((p) => p.invoiceId === invoice.id);
				const invoiceNotes = data.notes.filter((n) => n.invoiceId === invoice.id);
				const invoiceWorkItems = data.workItems.filter((w) => w.invoiceId === invoice.id);
				const customer = data.customers.find((c) => c.id === invoice.customerId) || {
					name: 'Unknown',
					emailAddress: 'unknown@example.com',
					id: invoice.customerId,
				};

				return {
					...invoice,
					payments: invoicePayments,
					notes: invoiceNotes,
					workItems: invoiceWorkItems,
					customer,
				} as InvoiceForUpdate;
			});
	}, [data]);

	const sectionedInvoices = useMemo(() => {
		if (!settings) return [];
		const grouped = groupInvoicesByFinancialYearAndQuarter(memoizedInvoices, settings);

		const sections: Array<{
			title: string;
			subtitle: string;
			data: InvoiceForUpdate[];
			key: string;
			hasUnpaid: boolean;
			unpaidCount: number;
		}> = [];

		grouped.forEach((yearGroup) => {
			yearGroup.quarters.forEach((quarter) => {
				const sectionKey = `${yearGroup.yearLabel}-${quarter.quarterLabel}`;
				const unpaidInvoices = quarter.invoices.filter((invoice) => !invoice.isPayed);
				const hasUnpaid = unpaidInvoices.length > 0;
				sections.push({
					title: yearGroup.yearLabel,
					subtitle: quarter.quarterLabel,
					data: quarter.invoices,
					key: sectionKey,
					hasUnpaid,
					unpaidCount: unpaidInvoices.length,
				});
			});
		});

		return sections;
	}, [memoizedInvoices, settings]);

	return {
		data,
		error,
		setError,
		isLoading,
		loadData,
		memoizedInvoices,
		sectionedInvoices,
	};
}
