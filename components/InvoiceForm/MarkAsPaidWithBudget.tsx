import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { InvoiceForUpdate } from '@/types';
import { useAddInvoiceToBudget } from '@/hooks/useAddInvoiceToBudget';
import AddToBudgetModal from '../AddToBudgetModal';

interface MarkAsPaidWithBudgetProps {
	invoice: InvoiceForUpdate;
	onMarkAsPaid: (invoiceId: string) => Promise<void>;
}

const MarkAsPaidWithBudget: React.FC<MarkAsPaidWithBudgetProps> = ({
	invoice,
	onMarkAsPaid,
}) => {
	const { colors } = useTheme();
	const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);

	const {
		isCategoryModalVisible,
		selectedCategory,
		showCategoryModal,
		hideCategoryModal,
		setSelectedCategory,
		handleAddInvoicesToBudget,
		incomeCategories,
	} = useAddInvoiceToBudget();

	const handleMarkAsPaid = async () => {
		Alert.alert(
			'Mark as Paid',
			'Would you like to add this invoice to your budget as income?',
			[
				{
					text: 'No, just mark as paid',
					style: 'cancel',
					onPress: async () => {
						setIsMarkingAsPaid(true);
						try {
							await onMarkAsPaid(invoice.id);
							Alert.alert('Success', 'Invoice marked as paid');
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
			]
		);
	};

	const handleConfirmAddToBudget = async () => {
		setIsMarkingAsPaid(true);
		try {
			await onMarkAsPaid(invoice.id);

			await handleAddInvoicesToBudget([invoice]);

			Alert.alert('Success', 'Invoice marked as paid and added to budget');
		} catch (error) {
			Alert.alert('Error', 'Failed to process invoice');
		} finally {
			setIsMarkingAsPaid(false);
		}
	};

	return (
		<>
			<TouchableOpacity
				onPress={handleMarkAsPaid}
				disabled={isMarkingAsPaid}
				className='bg-success p-3 rounded-md flex-row items-center justify-center'>
				<Ionicons name='checkmark-circle' size={20} color='white' />
				<Text className='text-white font-bold ml-2'>
					{isMarkingAsPaid ? 'Processing...' : 'Mark as Paid'}
				</Text>
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
