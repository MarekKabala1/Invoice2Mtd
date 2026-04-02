/**
 * AddToBudgetModal.tsx
 *
 * Modal for selecting an income category when adding paid invoices
 * to the budget. Styled consistently with MTD screens and the rest
 * of the app's visual language.
 *
 * Depends on: context/ThemeContext
 * Used by: components/InvoiceForm/InvoiceSettingsModal.tsx
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface AddToBudgetModalProps {
	isVisible: boolean;
	onClose: () => void;
	onConfirm: () => void;
	selectedCategory: string | null;
	onSelectCategory: (categoryId: string) => void;
	incomeCategories: Array<{ id: string; name: string; emoji: string }>;
	title?: string;
	confirmText?: string;
}

const AddToBudgetModal: React.FC<AddToBudgetModalProps> = ({
	isVisible,
	onClose,
	onConfirm,
	selectedCategory,
	onSelectCategory,
	incomeCategories,
	title = 'Select Income Category',
	confirmText = 'Confirm',
}) => {
	const { colors, isDark } = useTheme();

	return (
		<Modal
			visible={isVisible}
			transparent={true}
			animationType='slide'
			onRequestClose={onClose}>
			<View className='flex-1 justify-center items-center' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
				<View
					className='p-5 rounded-lg w-11/12'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				>
					{/* Header */}
					<Text
						className='text-lg font-bold mb-1 text-center'
						style={{ color: colors.text }}
					>
						{title}
					</Text>
					<Text
						className='text-xs mb-4 text-center'
						style={{ color: colors.noActive }}
					>
						Choose a category for this income
					</Text>

					{/* Category pills */}
					<View className='flex-row flex-wrap justify-center gap-2 mb-4'>
						{incomeCategories.map((category) => {
							const isSelected = selectedCategory === category.id;
							return (
								<TouchableOpacity
									key={category.id}
									onPress={() => onSelectCategory(category.id)}
									className='px-4 py-2.5 rounded-lg'
									style={{
										backgroundColor: isSelected
											? isDark ? '#2563eb' : '#1d4ed8'
											: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
									}}
								>
									<Text
										className='text-sm font-bold'
										style={{ color: isSelected ? 'white' : colors.text }}
									>
										{category.emoji} {category.name}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					{/* Action buttons */}
					<View className='flex-row gap-3'>
						<TouchableOpacity
							onPress={onClose}
							className='flex-1 py-3 rounded-lg items-center'
							style={{
								backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
							}}
						>
							<Text
								className='text-sm font-bold'
								style={{ color: colors.text }}
							>
								Cancel
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={onConfirm}
							className='flex-1 py-3 rounded-lg items-center'
							style={{
								backgroundColor: selectedCategory
									? isDark ? '#2563eb' : '#1d4ed8'
									: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
								opacity: selectedCategory ? 1 : 0.5,
							}}
							disabled={!selectedCategory}
						>
							<Text
								className='text-sm font-bold'
								style={{ color: selectedCategory ? 'white' : colors.noActive }}
							>
								{confirmText}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default AddToBudgetModal;
