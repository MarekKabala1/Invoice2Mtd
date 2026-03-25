import React from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerType, InvoiceType, UserType } from '@/db/zodSchema';
import { getCurrencySymbol } from '@/utils/getCurrencySymbol';
import { useEffect, useState } from 'react';
import { useIsInvoicePaid } from '@/hooks/useIsInvoicePaid';
import { sendPaymentReminder } from '@/utils/emailOperations';
import { handleSendInvoice, handleExportPdfInvoice } from '@/utils/invoiceFormOperations';
import { markInvoiceAsPaid, markInvoiceAsUnpaid } from '@/utils/invoiceSync';
import { toISO, quarterForDate } from '@/utils/mtdDates';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme as useThemeHook } from '@/context/ThemeContext';

const INCOME_CATEGORIES = [
	{ id: 'turnover', label: 'Turnover / Sales' },
	{ id: 'other_business_income', label: 'Other Business Income' },
	{ id: 'uk_property_non_fhl_income', label: 'UK Property (non-FHL)' },
	{ id: 'foreign_property_fhl_eea_income', label: 'Foreign Property FHL (EEA)' },
	{ id: 'foreign_property_fhl_non_eea_income', label: 'Foreign Property FHL (non-EEA)' },
];

export default function InvoiceSettingsModal({
	showSettings,
	setShowSettings,
	invoice,
	customer,
	onUpdate,
	setIsPayedOptimistic,
	user,
	workItems,
	payments,
	notes,
	bankDetails,
	onSyncComplete,
}: {
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	invoice: InvoiceType;
	customer: CustomerType | undefined;
	user: UserType;
	onUpdate: (id: string, updateData?: Partial<InvoiceType>) => void;
	setIsPayedOptimistic: (isPayed: boolean) => void;
	workItems: any[];
	payments: any[];
	notes: string;
	bankDetails: any;
	onSyncComplete?: () => void;
}) {
	const [localInvoice, setLocalInvoice] = useState(invoice);
	const { colors, isDark } = useTheme();
	const { isPayed } = useIsInvoicePaid(localInvoice);

	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCategoryPicker, setShowCategoryPicker] = useState(false);
	const [selectedIncomeCategory, setSelectedIncomeCategory] = useState('turnover');
	const [paymentDate, setPaymentDate] = useState(
		invoice.dueDate ? toISO(new Date(invoice.dueDate)) : toISO(new Date())
	);

	useEffect(() => {
		setLocalInvoice(invoice);
	}, [invoice.id]);

	const handleMarkAsPayed = async () => {
		if (isPayed) {
			// Mark as UNPAID
			Alert.alert(
				'Mark as Unpaid',
				'This will also delete the linked budget entry and MTD record. Continue?',
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Mark Unpaid',
						style: 'destructive',
						onPress: async () => {
							try {
								await markInvoiceAsUnpaid(invoice.id!);
								setLocalInvoice((prev) => ({ ...prev, isPayed: false }));
								setIsPayedOptimistic(false);
								onSyncComplete?.();
							} catch (error) {
								Alert.alert('Error', 'Failed to mark as unpaid.');
							}
						},
					},
				]
			);
		} else {
			// Mark as PAID — show category picker first
			setShowCategoryPicker(true);
		}
	};

	const handleCategorySelected = () => {
		setShowCategoryPicker(false);
		// Date defaults to due date, user can change
		setPaymentDate(invoice.dueDate ? toISO(new Date(invoice.dueDate)) : toISO(new Date()));
		setShowDatePicker(true);
	};

	const handleConfirmPaid = async () => {
		setShowDatePicker(false);
		const q = quarterForDate(new Date(paymentDate));
		const catLabel = INCOME_CATEGORIES.find((c) => c.id === selectedIncomeCategory)?.label ?? 'Turnover';
		Alert.alert(
			'Confirm Payment',
			`Category: ${catLabel}\n` +
			`Date: ${new Date(paymentDate).toLocaleDateString()}\n` +
			`Amount: ${getCurrencySymbol(invoice.currency)}${invoice.amountAfterTax?.toFixed(2)}\n` +
			`MTD quarter: Q${q.quarter} (${q.label})`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Confirm',
					onPress: async () => {
						try {
							await markInvoiceAsPaid(
								invoice.id!,
								invoice.amountAfterTax!,
								invoice.currency,
								paymentDate,
								selectedIncomeCategory,
								customer?.name ?? 'customer'
							);
							setLocalInvoice((prev) => ({ ...prev, isPayed: true }));
							setIsPayedOptimistic(true);
							onSyncComplete?.();
						} catch (error) {
							Alert.alert('Error', 'Failed to mark invoice as paid.');
						}
					},
				},
			]
		);
	};

	const howManyDaysOverdue = () => {
		const today = new Date();
		const dueDate = new Date(localInvoice.dueDate);
		const diffTime = Math.abs(today.getTime() - dueDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};
	const handleEditInvoice = () => {
		setShowSettings(false);
		router.push('/(stack)/createInvoice');
	};

	const handlePreview = () => {
		// Navigate to edit mode where preview is available
		setShowSettings(false);
		router.push('/(stack)/createInvoice');
	};

	const handleSavePdf = async () => {
		if (!user || !customer || !bankDetails) {
			Alert.alert('Error', 'Missing customer or bank details.');
			return;
		}
		try {
			await handleExportPdfInvoice(
				{ ...invoice, workItems, payments },
				user,
				customer,
				bankDetails,
				typeof notes === 'string' ? notes : '',
				false
			);
			Alert.alert('Saved', 'PDF saved to device.');
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to save PDF.');
		}
	};

	const handleSendPaymentReminder = async () => {
		try {
			await sendPaymentReminder(invoice, customer!, user);
			Alert.alert('Success', 'Payment reminder email composed.');
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to send payment reminder.');
		}
	};

	const handleShareInvoice = async () => {
		if (!customer || !bankDetails) {
			Alert.alert('Error', 'Missing customer or bank details.');
			return;
		}

		try {
			await handleSendInvoice(
				{ ...invoice, workItems, payments },
				user,
				customer,
				bankDetails,
				notes
			);
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to share invoice.');
		}
	};

	return (
		<>
			<Modal
				visible={showSettings}
				animationType='slide'
				transparent={true}
				onRequestClose={() => setShowSettings(false)}>
				<View className='flex-1 justify-end' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<View
						className='w-full h-fit rounded-t-lg p-6 gap-4'
						style={{ backgroundColor: isDark ? colors.nav : colors.card }}
					>
						<View className='flex-row w-full items-center justify-between'>
							<View className='flex-1'>
								<Text className='text-lg font-bold' style={{ color: colors.text }}>
									Invoice # {localInvoice.id} to {customer?.name}
								</Text>
								{!isPayed && (
									<Text className='text-sm mt-1' style={{ color: '#ee1c1c' }}>
										{howManyDaysOverdue()} days overdue
									</Text>
								)}
							</View>
							<TouchableOpacity
								onPress={() => setShowSettings(false)}
								className='p-2'>
								<MaterialCommunityIcons
									name='close'
									size={20}
									color={colors.text}
								/>
							</TouchableOpacity>
						</View>
						<View className='w-full gap-2 items-center justify-center'>
							<View
								className='flex-row w-full items-center justify-between pb-2'
								style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='cash-multiple'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm' style={{ color: colors.text }}>
										{isPayed ? 'Paid' : 'To Be Paid'}
									</Text>
								</View>
								{isPayed ? (
									<Text className='text-sm font-bold' style={{ color: '#39AD6A' }}>
										{getCurrencySymbol(localInvoice.currency)}
										{localInvoice.amountAfterTax.toFixed(2)}
									</Text>
								) : (
									<Text className='text-sm font-bold' style={{ color: '#ee1c1c' }}>
										{getCurrencySymbol(localInvoice.currency)}
										{localInvoice.amountAfterTax.toFixed(2)}
									</Text>
								)}
							</View>
							<View
								className='flex-row w-full items-center justify-between pb-2'
								style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='calendar-range'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm' style={{ color: colors.text }}>
										Invoice Due Date
									</Text>
								</View>
								<Text className='text-sm' style={{ color: colors.text }}>
									{new Date(localInvoice.dueDate).toLocaleDateString()}
								</Text>
							</View>
							<View
								className='flex-row w-full items-center justify-between pb-2'
								style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='file-document'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm' style={{ color: colors.text }}>
										Invoice Status
									</Text>
								</View>
								{isPayed ? (
									<Text className='text-sm font-bold' style={{ color: '#39AD6A' }}>
										Paid
									</Text>
								) : (
									<Text className='text-sm font-bold' style={{ color: '#ee1c1c' }}>
										Overdue
									</Text>
								)}
							</View>
							<View
								className='flex-row w-full items-center justify-between pb-2'
								style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='check-circle-outline'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm' style={{ color: colors.text }}>
										Mark as Paid
									</Text>
								</View>
								<TouchableOpacity
									onPress={handleMarkAsPayed}
									className='flex-row items-center justify-center'>
									{isPayed ? (
										<MaterialCommunityIcons
											name='checkbox-marked-outline'
											size={28}
											color='#39AD6A'
										/>
									) : (
										<MaterialCommunityIcons
											name='checkbox-blank-outline'
											size={28}
											color='#ee1c1c'
										/>
									)}
								</TouchableOpacity>
							</View>
						</View>

						{/* Action buttons */}
					<View className='flex-row gap-3 mt-2'>
						<TouchableOpacity
							onPress={handleEditInvoice}
							className='flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2'
							style={{
								backgroundColor: isDark ? '#2563eb' : '#1d4ed8',
								shadowColor: '#2563eb',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.3,
								shadowRadius: 4,
								elevation: 4,
							}}
						>
							<MaterialCommunityIcons name="pencil" size={18} color="white" />
							<Text className='font-bold text-white text-sm'>Edit</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleSavePdf}
							className='flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2'
							style={{
								backgroundColor: isDark ? '#2563eb' : '#1d4ed8',
								shadowColor: '#2563eb',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.3,
								shadowRadius: 4,
								elevation: 4,
							}}
						>
							<MaterialCommunityIcons name="file-pdf-box" size={18} color="white" />
							<Text className='font-bold text-white text-sm'>PDF</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleShareInvoice}
							className='flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2'
							style={{
								backgroundColor: '#39AD6A',
								shadowColor: '#39AD6A',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.3,
								shadowRadius: 4,
								elevation: 4,
							}}
						>
							<MaterialCommunityIcons name="share-variant" size={18} color="white" />
							<Text className='font-bold text-white text-sm'>Share</Text>
						</TouchableOpacity>
					</View>

					{!isPayed && customer?.emailAddress && (
							<TouchableOpacity
								onPress={handleSendPaymentReminder}
								className='flex-row w-full items-center justify-between pb-2'
								style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='email-send-outline'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm' style={{ color: colors.text }}>
										Send Payment Reminder
									</Text>
								</View>
								<MaterialCommunityIcons
									name='chevron-right'
									size={30}
									color={colors.noActive}
								/>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</Modal>

			{/* Income category picker modal */}
			{showCategoryPicker && (
				<Modal
					visible={showCategoryPicker}
					transparent={true}
					animationType='slide'
					onRequestClose={() => setShowCategoryPicker(false)}
				>
					<View className='flex-1 justify-center items-center' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
						<View
							className='p-5 rounded-lg w-11/12'
							style={{ backgroundColor: isDark ? colors.nav : colors.card }}
						>
							<Text className='text-lg font-bold text-center mb-4' style={{ color: colors.text }}>
								Select Income Category
							</Text>
							{INCOME_CATEGORIES.map((cat) => (
								<TouchableOpacity
									key={cat.id}
									onPress={() => setSelectedIncomeCategory(cat.id)}
									className='flex-row items-center p-3 rounded-lg mb-2'
									style={{
										backgroundColor: selectedIncomeCategory === cat.id
											? isDark ? '#2563eb' : '#1d4ed8'
											: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
									}}
								>
									<Text
										className='font-bold text-sm'
										style={{ color: selectedIncomeCategory === cat.id ? 'white' : colors.text }}
									>
										{cat.label}
									</Text>
								</TouchableOpacity>
							))}
							<View className='flex-row gap-3 mt-4'>
								<TouchableOpacity
									onPress={() => setShowCategoryPicker(false)}
									className='flex-1 py-3 rounded-lg items-center'
									style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
								>
									<Text className='font-bold' style={{ color: colors.text }}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={handleCategorySelected}
									className='flex-1 py-3 rounded-lg items-center'
									style={{ backgroundColor: '#39AD6A' }}
								>
									<Text className='font-bold text-white'>Next</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			)}

			{/* Payment date picker modal */}
			{showDatePicker && (
				<Modal
					visible={showDatePicker}
					transparent={true}
					animationType='slide'
					onRequestClose={() => setShowDatePicker(false)}
				>
					<View className='flex-1 justify-center items-center' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
						<View
							className='p-5 rounded-lg w-11/12'
							style={{ backgroundColor: isDark ? colors.nav : colors.card }}
						>
							<Text className='text-lg font-bold text-center mb-4' style={{ color: colors.text }}>
								Payment Date
							</Text>
							<DateTimePicker
								value={new Date(paymentDate)}
								mode='date'
								onChange={(_, date) => {
									if (date) setPaymentDate(toISO(date));
								}}
								display={Platform.OS === 'ios' ? 'inline' : 'default'}
							/>
							<View className='flex-row gap-3 mt-4'>
								<TouchableOpacity
									onPress={() => setShowDatePicker(false)}
									className='flex-1 py-3 rounded-lg items-center'
									style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
								>
									<Text className='font-bold' style={{ color: colors.text }}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={handleConfirmPaid}
									className='flex-1 py-3 rounded-lg items-center'
									style={{ backgroundColor: '#39AD6A' }}
								>
									<Text className='font-bold text-white'>Confirm</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			)}
		</>
	);
}
