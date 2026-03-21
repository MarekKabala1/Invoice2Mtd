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
	const { colors } = useTheme();

	return (
		<Modal
			visible={isVisible}
			transparent={true}
			animationType='slide'
			onRequestClose={onClose}>
			<View className='flex-1 justify-center items-center bg-light-text/30 dark:bg-dark-text/30'>
				<View className='bg-light-primary dark:bg-dark-primary p-4 rounded-lg w-11/12'>
					<Text className='text-lg font-bold mb-4 text-center text-light-text dark:text-dark-text'>
						{title}
					</Text>
					<View className='flex-row flex-wrap justify-center'>
						{incomeCategories.map((category) => (
							<TouchableOpacity
								key={category.id}
								onPress={() => onSelectCategory(category.id)}
								className={`p-2 m-1 rounded-md ${selectedCategory === category.id ? 'bg-success' : 'bg-muted'}`}>
								<Text
									className={`text-center ${selectedCategory === category.id ? 'text-light-text' : 'text-dark-text'}`}>
									{category.emoji} {category.name}
								</Text>
							</TouchableOpacity>
						))}
					</View>
					<View className='flex-row justify-between mt-4'>
						<TouchableOpacity
							onPress={onClose}
							className='bg-danger p-2 rounded-md'>
							<Text className='text-dark-text'>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={onConfirm}
							className='bg-success p-2 rounded-md'
							disabled={!selectedCategory}>
							<Text className='text-dark-text'>{confirmText}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default AddToBudgetModal;
