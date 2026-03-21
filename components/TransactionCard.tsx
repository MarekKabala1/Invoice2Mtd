import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryById, getCategoryEmoji } from '@/utils/categories';
import { getCurrencySymbol } from '@/utils/getCurrencySymbol';
import BaseCard from './BaseCard';
import { useTheme } from '@/context/ThemeContext';
import { format } from 'date-fns';

const TransactionCard = ({
	transaction,
	onDelete,
	onUpdate,
}: {
	transaction: any;
	onDelete: (id: string) => void;
	onUpdate: (transaction: any) => void;
}) => {
	const { colors } = useTheme();
	return (
		<>
			<TouchableOpacity
				onLongPress={() => onDelete(transaction.id)}
				className='flex-row justify-between items-center p-4 border-b border-light-text dark:border-dark-text mx-2'>
				<View className='flex-row items-center'>
					<Text className='mr-2 text-xl'>
						{getCategoryEmoji(transaction.categoryId)}
					</Text>
					<View>
						<Text className='font-bold text-light-text dark:text-dark-text'>
							{getCategoryById(transaction.categoryId)?.name ||
								transaction.description}
						</Text>
						<Text className='text-xs text-light-text/50 dark:text-dark-text/50'>
							{format(new Date(transaction.date), 'dd MMM yyyy')}
						</Text>
					</View>
				</View>
				<View className='flex-row items-center gap-2'>
					<View className='justify-center items-end'>
						<Text
							className={`${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'} font-semibold`}>
							{transaction.type === 'INCOME' ? '+' : '-'}
							{getCurrencySymbol(transaction.currency)}
							{transaction.amount.toFixed(2)}
						</Text>
						<Text className='text-light-text/50 dark:text-dark-text/50 text-xs'>
							{transaction.description}
						</Text>
					</View>
					<TouchableOpacity
						onPress={() => onUpdate(transaction)}
						className='border border-light-text dark:border-dark-text rounded-md p-1'>
						<MaterialCommunityIcons
							name='update'
							size={16}
							color={colors.text}
						/>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
			<Text className='text-xs text-light-text/50 dark:text-dark-text/50 text-center'>
				*Press and hold to delete Transaction
			</Text>
		</>
	);
};

export default TransactionCard;
