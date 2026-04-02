import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { InvoiceForUpdate } from '@/types';
import { useAddInvoiceToBudget } from '@/hooks/invoice/useAddInvoiceToBudget';
import AddToBudgetModal from '@/components/budget/AddToBudgetModal';
import { addMtdTransaction, refreshCurrentYear } from '@/db/mtdOperations';
import { getCurrentUserId } from '@/utils/shared/getCurrentUser';

interface MarkAsPaidWithBudgetProps {
	invoice: InvoiceForUpdate;
	onMarkAsPaid: (invoiceId: string) => Promise<void>;
}

const MarkAsPaidWithBudget: React.FC<MarkAsPaidWithBudgetProps> = ({ invoice, onMarkAsPaid }) => {
	const { colors } = useTheme();
	const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);

	const { isCategoryModalVisible, selectedCategory, showCategoryModal, hideCategoryModal, setSelectedCategory, handleAddInvoicesToBudget, incomeCategories } =
		useAddInvoiceToBudget();

	const getQuarterForDate = (dateStr: string): number => {
		const date = new Date(dateStr);
		const m = date.getMonth();
		const d = date.getDate();
		if ((m === 3 && d >= 6) || m === 4 || (m === 5 && d <= 5)) return 1;
		if ((m === 6 && d >= 6) || m === 7 || (m === 8 && d <= 5)) return 2;
		if ((m === 9 && d >= 6) || m === 10 || m === 11) return 3;
		return 4;
	};

	const handleMarkAsPaidWithMtdPrompt = async () => {
		const quarter = getQuarterForDate(invoice.invoiceDate);
		const amountFormatted = (invoice.amountAfterTax || 0).toFixed(2);

		Alert.alert('Add to MTD Records?', `Add this invoice (£${amountFormatted}) to MTD records for Q${quarter}?`, [
			{
				text: 'No, just record',
				style: 'cancel',
			},
			{
				text: 'Yes, add to MTD',
				onPress: async () => {
					try {
						const userId = await getCurrentUserId();
						if (!userId) {
							Alert.alert('Error', 'No user profile found');
							return;
						}
						await addMtdTransaction(
							{
								type: 'income',
								category: 'turnover',
								amount: invoice.amountAfterTax || 0,
								description: `Invoice ${invoice.id}`,
								date: invoice.invoiceDate,
								invoiceId: invoice.id,
							},
							userId,
						);
						await refreshCurrentYear(userId);
						Alert.alert('Success', 'Added to MTD records');
					} catch (error) {
						const msg = error instanceof Error ? error.message : 'Failed to add MTD record';
						Alert.alert('Error', msg);
					}
				},
			},
		]);
	};

	const handleMarkAsPaid = async () => {
		Alert.alert('Mark as Paid', 'Would you like to add this invoice to your budget as income?', [
			{
				text: 'No, just mark as paid',
				style: 'cancel',
				onPress: async () => {
					setIsMarkingAsPaid(true);
					try {
						await onMarkAsPaid(invoice.id);
						Alert.alert('Success', 'Invoice marked as paid');

						// After successful mark as paid, prompt for MTD
						setTimeout(() => {
							handleMarkAsPaidWithMtdPrompt();
						}, 500);
					} catch (error) {
						Alert.alert('Error', 'Failed to mark invoice as paid');
					} finally {
						setIsMarkingAsPaid(false);
					}
				},
			},
			{
				text: 'Yes, add to budget',
				onPress: () => {
					showCategoryModal();
				},
			},
		]);
	};

	const handleConfirmAddToBudget = async () => {
		setIsMarkingAsPaid(true);
		try {
			await onMarkAsPaid(invoice.id);

			await handleAddInvoicesToBudget([invoice]);

			Alert.alert('Success', 'Invoice marked as paid and added to budget');

			// After successful budget add, prompt for MTD
			setTimeout(() => {
				handleMarkAsPaidWithMtdPrompt();
			}, 500);
		} catch (error) {
			Alert.alert('Error', 'Failed to process invoice');
		} finally {
			setIsMarkingAsPaid(false);
		}
	};

	return (
		<>
			<TouchableOpacity onPress={handleMarkAsPaid} disabled={isMarkingAsPaid} className='bg-success p-3 rounded-md flex-row items-center justify-center'>
				<Ionicons name='checkmark-circle' size={20} color='white' />
				<Text className='text-white font-bold ml-2'>{isMarkingAsPaid ? 'Processing...' : 'Mark as Paid'}</Text>
			</TouchableOpacity>

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
};

export default MarkAsPaidWithBudget;
