import React from 'react';
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerType, InvoiceType, UserType } from '@/db/zodSchema';
import { getCurrencySymbol } from '@/utils/getCurrencySymbol';
import { useEffect, useState } from 'react';
import { useIsInvoicePaid } from '@/hooks/useIsInvoicePaid';
import { useAddInvoiceToBudget } from '@/hooks/useAddInvoiceToBudget';
import AddToBudgetModal from '../AddToBudgetModal';
import { sendPaymentReminder } from '@/utils/emailOperations';
import { handleSendInvoice } from '@/utils/invoiceFormOperations';
import { addMtdTransaction } from '@/db/mtdOperations';
import { useAppSettings } from '@/context/AppSettingsContext';
import { toISO, quarterForDate } from '@/utils/mtdDates';
import { getCurrentUserId } from '@/utils/getCurrentUser';

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
}) {
	const [localInvoice, setLocalInvoice] = useState(invoice);
	const { colors, isDark } = useTheme();
	const { isPayed } = useIsInvoicePaid(localInvoice);

	const {
		isCategoryModalVisible,
		selectedCategory,
		showCategoryModal,
		hideCategoryModal,
		setSelectedCategory,
		handleAddInvoicesToBudget,
		incomeCategories,
	} = useAddInvoiceToBudget();

	useEffect(() => {
		setLocalInvoice(invoice);
	}, [invoice.id]);

	const handleMarkAsPayed = async () => {
		const newPayedStatus = !isPayed;
		setIsPayedOptimistic(newPayedStatus);

		if (newPayedStatus) {
			Alert.alert(
				'Mark as Paid',
				'Would you like to add this paid invoice to your transactions/budget?',
				[
					{
						text: 'No, just mark as paid',
						style: 'cancel',
						onPress: async () => {
							setLocalInvoice((prev) => ({ ...prev, isPayed: newPayedStatus }));
							setIsPayedOptimistic(newPayedStatus);
							try {
								onUpdate(invoice.id, { isPayed: newPayedStatus });
							} catch (error) {
								setLocalInvoice((prev) => ({
									...prev,
									isPayed: !newPayedStatus,
								}));
								setIsPayedOptimistic(!newPayedStatus);
							}
						},
					},
					{
						text: 'Yes, add to budget',
						onPress: showCategoryModal,
					},
				]
			);
		} else {
			setLocalInvoice((prev) => ({ ...prev, isPayed: newPayedStatus }));
			setIsPayedOptimistic(newPayedStatus);
			try {
				onUpdate(invoice.id, { isPayed: newPayedStatus });
			} catch (error) {
				setLocalInvoice((prev) => ({ ...prev, isPayed: !newPayedStatus }));
				setIsPayedOptimistic(!newPayedStatus);
			}
		}
	};

	const handleConfirmAddToBudget = async () => {
		setLocalInvoice((prev) => ({ ...prev, isPayed: true }));
		setIsPayedOptimistic(true);
		try {
			onUpdate(invoice.id, { isPayed: true });
			await handleAddInvoicesToBudget([
				{
					...invoice,
					customer: customer!,
					payments: [],
					notes: [],
					workItems: [],
				},
			]);

			// Also create MTD income record linked to this invoice
			// so it shows in the Tax tab immediately
			const mtdUserId = await getCurrentUserId();
			if (mtdUserId) {
				const invoiceDate = new Date(invoice.invoiceDate!);
				await addMtdTransaction(
					{
						date: toISO(invoiceDate),
						description: `Invoice from ${customer?.name ?? 'customer'}`,
						amount: invoice.amountAfterTax!,
						type: 'income',
						category: 'turnover',
						notes: `Linked to invoice #${invoice.id}`,
						invoiceId: invoice.id!,
					},
					mtdUserId
				);
			}
		} catch (error) {
			setLocalInvoice((prev) => ({ ...prev, isPayed: false }));
			setIsPayedOptimistic(false);
		}
	};

	const howManyDaysOverdue = () => {
		const today = new Date();
		const dueDate = new Date(localInvoice.dueDate);
		const diffTime = Math.abs(today.getTime() - dueDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};
	const handleEditInvoice = () => {
		onUpdate(invoice.id);
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
							<TouchableOpacity
								onPress={handleEditInvoice}
								className='flex-row w-full items-center justify-between pb-2'
								style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='pencil'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm' style={{ color: colors.text }}>
										Edit Invoice
									</Text>
								</View>
								<MaterialCommunityIcons
									name='chevron-right'
									size={30}
									color={colors.noActive}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleShareInvoice}
								className='flex-row w-full items-center justify-between pb-2'
								style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='share-variant'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm' style={{ color: colors.text }}>
										Share Invoice
									</Text>
								</View>
								<MaterialCommunityIcons
									name='chevron-right'
									size={30}
									color={colors.noActive}
								/>
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
			<AddToBudgetModal
				isVisible={isCategoryModalVisible}
				onClose={hideCategoryModal}
				onConfirm={handleConfirmAddToBudget}
				selectedCategory={selectedCategory}
				onSelectCategory={setSelectedCategory}
				incomeCategories={incomeCategories}
				title='Add Invoice to Budget'
				confirmText='Mark as Paid & Add to Budget'
			/>
		</>
	);
}
