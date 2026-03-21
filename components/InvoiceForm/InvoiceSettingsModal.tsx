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
	const { colors } = useTheme();
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
				<View className='flex-1 justify-end  bg-light-text/30 dark:bg-dark-text/30'>
					<View className='bg-light-primary dark:bg-dark-primary w-full h-fit rounded-t-lg p-6 gap-4'>
						<View className='flex-row w-full items-center justify-between  '>
							<View>
								<Text className='text-lg font-bold text-light-text dark:text-dark-text'>
									Invoice # {localInvoice.id} to {customer?.name}
								</Text>
								<Text className='text-sm text-danger dark:text-danger'>
									{isPayed ? '' : `${howManyDaysOverdue()} days overdue`}{' '}
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => setShowSettings(false)}
								className='mb-4'>
								<MaterialCommunityIcons
									name='close'
									size={20}
									color={colors.text}
								/>
							</TouchableOpacity>
						</View>
						<View className=' w-full gap-2 items-center justify-center'>
							<View className='flex-row w-full  items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='cash-multiple'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm text-light-text dark:text-dark-text'>
										{isPayed ? 'Payed' : 'To Be Payed'}
									</Text>
								</View>
								{isPayed ? (
									<Text className='text-sm text-success dark:text-success'>
										{getCurrencySymbol(localInvoice.currency)}
										{localInvoice.amountAfterTax.toFixed(2)}
									</Text>
								) : (
									<Text className='text-sm text-danger dark:text-danger'>
										{getCurrencySymbol(localInvoice.currency)}
										{localInvoice.amountAfterTax.toFixed(2)}
									</Text>
								)}
							</View>
							<View className='flex-row w-full  items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='calendar-range'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm text-light-text dark:text-dark-text'>
										Invoice Due Date
									</Text>
								</View>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									{new Date(localInvoice.dueDate).toLocaleDateString()}
								</Text>
							</View>
							<View className='flex-row w-full  items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='file-document'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm text-light-text dark:text-dark-text'>
										Invoice Status
									</Text>
								</View>
								{isPayed ? (
									<Text className='text-sm font-bold text-success dark:text-success'>
										Payed
									</Text>
								) : (
									<Text className='text-sm font-bold text-danger dark:text-danger'>
										Overdue
									</Text>
								)}
							</View>
							<View className='flex-row w-full  items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='check-circle-outline'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm text-light-text dark:text-dark-text'>
										Mark as payed
									</Text>
								</View>
								<TouchableOpacity
									onPress={handleMarkAsPayed}
									className='flex-row items-center justify-center'>
									{isPayed ? (
										<MaterialCommunityIcons
											name='checkbox-marked-outline'
											size={28}
											color={colors.success}
										/>
									) : (
										<MaterialCommunityIcons
											name='checkbox-blank-outline'
											size={28}
											color={colors.danger}
										/>
									)}
								</TouchableOpacity>
							</View>
							<TouchableOpacity
								onPress={handleEditInvoice}
								className='flex-row w-full  items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='pencil'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm text-light-text dark:text-dark-text'>
										Edit Invoice
									</Text>
								</View>
								<MaterialCommunityIcons
									name='chevron-right'
									size={30}
									color={colors.text}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleShareInvoice}
								className='flex-row w-full  items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='share-variant'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm text-light-text dark:text-dark-text'>
										Share Invoice
									</Text>
								</View>
								<MaterialCommunityIcons
									name='chevron-right'
									size={30}
									color={colors.text}
								/>
							</TouchableOpacity>
						</View>
						{!isPayed && customer?.emailAddress && (
							<TouchableOpacity
								onPress={handleSendPaymentReminder}
								className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
								<View className='flex-row items-center gap-2'>
									<MaterialCommunityIcons
										name='email-send-outline'
										size={40}
										color={colors.text}
									/>
									<Text className='text-sm text-light-text dark:text-dark-text'>
										Send Payment Reminder
									</Text>
								</View>
								<MaterialCommunityIcons
									name='chevron-right'
									size={30}
									color={colors.text}
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
