import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '@/db/config';
import { User, Invoice, Payment } from '@/db/schema';
import { UserType, InvoiceType, PaymentType } from '@/db/zodSchema';
import PickerWithTouchableOpacity from '@/components/Picker';
import { Controller, useForm } from 'react-hook-form';
import { eq, inArray } from 'drizzle-orm';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';
import { calculateInvoiceTotal, calculateMonthlyTotals } from '@/utils/invoiceCalculations';
import { format, parseISO } from 'date-fns';
import BaseCard from '@/components/BaseCard';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

type ViewMode = 'all' | 'monthly';

export default function Charts() {
	const { control, watch } = useForm<UserType>();
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

	const { colors, isDark } = useTheme();
	const selectedUserId = watch('id');

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
		} catch (error) {
			console.error('Failed to get user data:', error);
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
				setTotals({
					totalBeforeTax: 0,
					totalAfterTax: 0,
					taxToPay: 0,
					totalAfterPayment: 0,
				});
				return;
			}

			setInvoices(invoiceData as unknown as InvoiceType[]);

			const invoiceIds = invoiceData.map((invoice) => invoice.id);
			const paymentsData = await db.select().from(Payment).where(inArray(Payment.invoiceId, invoiceIds));

			setPayments(paymentsData as unknown as PaymentType[]);

			const calculatedTotals = calculateInvoiceTotal(invoiceData as unknown as InvoiceType[], paymentsData as unknown as PaymentType[]);

			setTotals(calculatedTotals);
		} catch (error) {
			console.error('Failed to get invoice data:', error);
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
		}, [selectedUserId, getUsers, getUserInvoices])
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

	const screenWidth = Dimensions.get('window').width;
	const chartWidth = Math.max(screenWidth - 32, chartData.labels.length * 50);
	const insets = useSafeAreaInsets();

	if (error) {
		return (
			<View style={{ paddingTop: insets.top }} className='flex-1 bg-light-primary dark:bg-dark-primary p-4 w-screen justify-center items-center'>
				<Text className='text-lg text-red-500 text-center mb-4'>{error}</Text>
				<TouchableOpacity
					onPress={() => {
						setError(null);
						getUsers();
					}}
					className='bg-light-accent dark:bg-dark-accent p-3 rounded-lg'>
					<Text className='text-light-text dark:text-dark-text'>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={{ paddingTop: insets.top }} className='flex-1 bg-light-primary dark:bg-dark-primary p-4 w-screen'>
			<ScrollView>
				<View className='w-full items-end'>
					<ThemeToggle size={30} />
				</View>
				<View className='gap-4'>
					<Text className='text-center font-bold text-light-text dark:text-dark-text'>Pick User to display charts</Text>
					<Controller
						control={control}
						name='id'
						render={({ field: { onChange, onBlur, value } }) => (
							<PickerWithTouchableOpacity initialValue={'Select User'} onValueChange={onChange} items={userOptions} disabled={isLoading} />
						)}
					/>

					{invoices.length > 0 && (
						<>
							<View className='flex-row justify-between items-center'>
								<View className='flex-1'>
									<PickerWithTouchableOpacity initialValue={'All Months'} onValueChange={setSelectedMonth} items={availableMonths} disabled={isLoading} />
								</View>
								<View className='flex-row ml-2'>
									<TouchableOpacity
										onPress={() => setViewMode('monthly')}
										className={`px-3 py-1 ${viewMode === 'monthly' ? 'bg-light-accent dark:bg-dark-accent border border-light-accent/50 dark:border-dark-accent/50' : 'bg-light-nav dark:bg-dark-nav'}`}>
										<Text
											className={`${viewMode === 'monthly' ? 'text-light-text dark:text-dark-text font-bold' : 'text-light-text/50 dark:text-dark-text/50'}`}>
											Monthly
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => setViewMode('all')}
										className={`px-3 py-1 ${viewMode === 'all' ? 'bg-light-accent dark:bg-dark-accent border border-light-accent/50 dark:border-dark-accent/50' : 'bg-light-nav dark:bg-dark-nav'}`}>
										<Text className={`${viewMode === 'all' ? 'text-light-text dark:text-dark-text font-bold' : 'text-light-text/50 dark:text-dark-text/50'}`}>
											All
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							<ScrollView horizontal showsHorizontalScrollIndicator={false}>
								<LineChart
									data={chartData}
									width={chartWidth}
									height={360}
									yAxisLabel='£'
									chartConfig={{
										backgroundColor: colors.nav,
										backgroundGradientFrom: colors.nav,
										backgroundGradientTo: colors.primary,
										paddingTop: 10,
										decimalPlaces: 2,
										color: (opacity = 1) => (isDark ? `rgba(222, 197, 178, ${opacity})` : `rgba(73, 62, 62, ${opacity})`),
										labelColor: (opacity = 1) => (isDark ? `rgba(222, 197, 178, ${opacity})` : `rgba(0, 0, 0, ${opacity})`),
										propsForDots: {
											r: '6',
											strokeWidth: '2',
											stroke: colors.primary,
										},
									}}
									style={{
										marginVertical: 8,
									}}
									verticalLabelRotation={90}
									xLabelsOffset={-10}
									decorator={() => {
										return chartData.datasets[0].data
											.map((value, index) => {
												if (index === 0) return null;
												return (
													<View key={index}>
														<Text
															style={{
																position: 'absolute',
																left: (chartWidth / chartData.labels.length) * index,
																top: 320 - (value / Math.max(...chartData.datasets[0].data)) * 320,
																width: 'auto',
																textAlign: 'center',
																backgroundColor: colors.textOpacity,
																color: colors.primary,
																fontSize: 10,
																padding: 3,
															}}>
															£{value}
														</Text>
													</View>
												);
											})
											.filter(Boolean);
									}}
								/>
							</ScrollView>
						</>
					)}

					<BaseCard className='rounded-sm p-2'>
						<View className='flex-row justify-between border-b border-gray-200 pb-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Invoices Sent So Far this Year:</Text>
							<Text className='text-light-text dark:text-dark-text'>{invoices.length}</Text>
						</View>

						<View className='flex-row justify-between border-b border-gray-200 py-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Sum Before Tax:</Text>
							<Text className='text-light-text dark:text-dark-text'>{totals.totalBeforeTax.toFixed(2)}</Text>
						</View>

						<View className='flex-row justify-between border-b border-gray-200 py-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Sum After Tax:</Text>
							<Text className='text-light-text dark:text-dark-text'>£{totals.totalAfterTax.toFixed(2)}</Text>
						</View>

						<View className='flex-row justify-between py-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Tax to Pay:</Text>
							<Text className='text-light-text dark:text-dark-text'>£{totals.taxToPay.toFixed(2)}</Text>
						</View>
					</BaseCard>
				</View>
			</ScrollView>
		</View>
	);
}
