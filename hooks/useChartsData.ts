/**
 * useChartsData.ts
 *
 * Fetches users, their invoices, and payments for the Charts screen.
 * Manages all data state and loading/error states.
 *
 * WHY: charts.tsx had 3 inline db.select() calls (Users, Invoices, Payments)
 *      with manual state management. All DB access must go through hooks.
 *
 * Depends on: db/config, db/schema, utils/invoiceCalculations
 * Used by: components/invoice/ChartsHub.tsx (extracted from charts.tsx)
 */

import { useCallback, useState, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { db } from '@/db/config';
import { User, Invoice, Payment } from '@/db/schema';
import { UserType, InvoiceType, PaymentType } from '@/db/zodSchema';
import { eq, inArray } from 'drizzle-orm';
import { calculateInvoiceTotal, calculateMonthlyTotals } from '@/utils/invoiceCalculations';
import { format, parseISO } from 'date-fns';

export type ViewMode = 'all' | 'monthly';

export function useChartsData() {
	const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);
	const [invoices, setInvoices] = useState<InvoiceType[]>([]);
	const [payments, setPayments] = useState<PaymentType[]>([]);
	const [viewMode, setViewMode] = useState<ViewMode>('monthly');
	const [selectedMonth, setSelectedMonth] = useState<string>('all');
	const [totals, setTotals] = useState({
		totalBeforeTax: 0,
		totalAfterTax: 0,
		taxToPay: 0,
		totalAfterPayment: 0,
	});
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

	const getUsers = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const usersData = await db.select().from(User);

			if (usersData.length === 0) {
				setError('No users found. Please add a user first.');
			}

			const options = usersData.map((user) => ({
				label: user.fullName || 'Unnamed User',
				value: user.id,
			}));
			setUserOptions(options);
		} catch (err) {
			console.error('Failed to get user data:', err);
			setError('Unable to retrieve users. Please check your connection and try again.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	const getUserInvoices = useCallback(async (userId: string) => {
		if (!userId) {
			setError('Please select a valid user.');
			return;
		}

		try {
			setIsLoading(true);
			setError(null);
			const invoiceData = await db.select().from(Invoice).where(eq(Invoice.userId, userId));

			if (invoiceData.length === 0) {
				setError('No invoices found for the selected user.');
				setInvoices([]);
				setPayments([]);
				setTotals({ totalBeforeTax: 0, totalAfterTax: 0, taxToPay: 0, totalAfterPayment: 0 });
				return;
			}

			setInvoices(invoiceData as unknown as InvoiceType[]);

			const invoiceIds = invoiceData.map((invoice) => invoice.id);
			const paymentsData = await db.select().from(Payment).where(inArray(Payment.invoiceId, invoiceIds));

			setPayments(paymentsData as unknown as PaymentType[]);

			const calculatedTotals = calculateInvoiceTotal(
				invoiceData as unknown as InvoiceType[],
				paymentsData as unknown as PaymentType[],
			);

			setTotals(calculatedTotals);
		} catch (err) {
			console.error('Failed to get invoice data:', err);
			setError('Unable to retrieve invoices. Please check your connection and try again.');
			setInvoices([]);
			setPayments([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			if (selectedUserId) {
				getUserInvoices(selectedUserId);
			}
			getUsers();
		}, [selectedUserId, getUsers, getUserInvoices]),
	);

	const monthlyTotals = useMemo(() => {
		return calculateMonthlyTotals(invoices);
	}, [invoices]);

	const availableMonths = useMemo(() => {
		const months = Object.keys(monthlyTotals).sort();
		return [
			{ label: 'All Months', value: 'all' },
			...months.map((month) => ({
				label: format(parseISO(month), 'MMMM yyyy'),
				value: month,
			})),
		];
	}, [monthlyTotals]);

	const chartData = useMemo(() => {
		if (viewMode === 'monthly') {
			const sortedMonths = Object.keys(monthlyTotals)
				.filter((month) => selectedMonth === 'all' || month === selectedMonth)
				.sort();

			return {
				labels: ['', ...sortedMonths.map((month) => format(parseISO(month), 'MM/yy'))],
				datasets: [
					{
						data: [0, ...sortedMonths.map((month) => monthlyTotals[month].totalBeforeTax)],
					},
				],
			};
		} else {
			const filteredInvoices =
				selectedMonth === 'all'
					? invoices
					: invoices.filter((invoice) => {
							const invoiceMonth = invoice.createdAt?.slice(0, 7);
							return invoiceMonth === selectedMonth;
						});

			return {
				labels: ['', ...filteredInvoices.map((invoice) => format(new Date(invoice.createdAt || ''), 'dd/MM/yy'))],
				datasets: [
					{
						data: [0, ...filteredInvoices.map((invoice) => invoice.amountBeforeTax || 0)],
					},
				],
			};
		}
	}, [invoices, monthlyTotals, viewMode, selectedMonth]);

	const retry = useCallback(() => {
		setError(null);
		getUsers();
	}, [getUsers]);

	return {
		userOptions,
		invoices,
		payments,
		totals,
		error,
		isLoading,
		viewMode,
		setViewMode,
		selectedMonth,
		setSelectedMonth,
		monthlyTotals,
		availableMonths,
		chartData,
		setSelectedUserId,
		retry,
	};
}
