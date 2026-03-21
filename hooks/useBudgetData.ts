import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { db } from '@/db/config';
import { Transactions } from '@/db/schema';
import { TransactionType } from '@/db/zodSchema';
import { between, eq } from 'drizzle-orm';
import { startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { calculateTotals } from '@/utils/transactionCalculation';

export const useBudgetData = () => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [transactions, setTransactions] = useState<TransactionType[]>([]);
	const [allTransactions, setAllTransactions] = useState<TransactionType[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterByTransactionType, setFilterByTransactionType] = useState<
		TransactionType['type'] | ''
	>('');
	const [openSearchInput, setOpenSearchInput] = useState(false);
	const [previousBalance, setPreviousBalance] = useState(0);

	const getTransactions = useCallback(async (date: Date) => {
		const monthStart = startOfMonth(date).toISOString();
		const monthEnd = endOfMonth(date).toISOString();
		const getTransactionForGivenDate = await db
			.select()
			.from(Transactions)
			.where(between(Transactions.date, monthStart, monthEnd));
		const transformedData = getTransactionForGivenDate.map((item) => ({
			id: item.id,
			categoryId: item.categoryId!,
			userId: item.userId!,
			amount: item.amount!,
			date: item.date!,
			description: item.description!,
			type: item.type as 'EXPENSE' | 'INCOME',
			currency: item.currency!,
		}));
		setTransactions(
			transformedData.sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
			)
		);
	}, []);

	const getAllTransactions = useCallback(async () => {
		const getAllTransactions = await db.select().from(Transactions);
		const transformedData = getAllTransactions.map((item) => ({
			id: item.id,
			categoryId: item.categoryId!,
			userId: item.userId!,
			amount: item.amount!,
			date: item.date!,
			description: item.description!,
			type: item.type as 'EXPENSE' | 'INCOME',
			currency: item.currency!,
		}));
		setAllTransactions(transformedData);
	}, []);

	useEffect(() => {
		getTransactions(currentDate);
	}, [currentDate, getTransactions]);

	useEffect(() => {
		getAllTransactions();
	}, [getAllTransactions, transactions]);

	useFocusEffect(
		useCallback(() => {
			getTransactions(currentDate);
			getAllTransactions();
		}, [currentDate, getTransactions, getAllTransactions])
	);

	const handlePreviousMonth = useCallback(() => {
		setCurrentDate((prev) => subMonths(prev, 1));
	}, []);

	const handleNextMonth = useCallback(() => {
		setCurrentDate((prev) => addMonths(prev, 1));
	}, []);

	const handleToday = useCallback(() => {
		setCurrentDate(new Date());
	}, []);

	const deleteTransaction = useCallback(async (transactionId: string) => {
		await db.delete(Transactions).where(eq(Transactions.id, transactionId));
		setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
	}, []);

	const filterTransaction = useCallback(
		(query: string) => {
			setSearchQuery(query);
			if (query) {
				setTransactions((prev) =>
					prev.filter((transaction) => {
						const matchesDescription = transaction.description
							.toLowerCase()
							.includes(query.toLowerCase());
						return matchesDescription;
					})
				);
			} else {
				getTransactions(currentDate);
			}
		},
		[currentDate, getTransactions]
	);

	useEffect(() => {
		filterTransaction(searchQuery);
	}, [filterByTransactionType, searchQuery, filterTransaction]);

	const handleFilterChange = useCallback(
		async (type: TransactionType['type'] | '') => {
			await getTransactions(currentDate);
			setFilterByTransactionType(type === filterByTransactionType ? '' : type);
			if (type) {
				setTransactions((prev) =>
					prev.filter((transaction) => transaction.type === type)
				);
			} else {
				getTransactions(currentDate);
			}
		},
		[currentDate, filterByTransactionType, getTransactions]
	);

	const openSearch = useCallback(() => {
		setSearchQuery('');
		setOpenSearchInput((prev) => !prev);
	}, []);

	const overallBalance = useMemo(
		() => calculateTotals(allTransactions),
		[allTransactions]
	);
	const monthlyBalance = useMemo(
		() => calculateTotals(transactions).balance,
		[transactions]
	);
	const totalIncomeForTheMonth = useMemo(
		() => calculateTotals(transactions).income,
		[transactions]
	);
	const totalExpensesForTheMonth = useMemo(
		() => calculateTotals(transactions).expense,
		[transactions]
	);

	useEffect(() => {
		setPreviousBalance(overallBalance.balance);
	}, [overallBalance]);

	return {
		currentDate,
		setCurrentDate,
		transactions,
		setTransactions,
		allTransactions,
		openSearchInput,
		setOpenSearchInput,
		searchQuery,
		setSearchQuery,
		filterByTransactionType,
		setFilterByTransactionType,
		previousBalance,
		overallBalance,
		monthlyBalance,
		totalIncomeForTheMonth,
		totalExpensesForTheMonth,
		handlePreviousMonth,
		handleNextMonth,
		deleteTransaction,
		filterTransaction,
		handleFilterChange,
		openSearch,
		handleToday,
	};
};
