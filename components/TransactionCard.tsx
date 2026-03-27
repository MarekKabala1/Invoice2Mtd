import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryById, getCategoryEmoji } from '@/utils/budget/categories';
import { getCurrencySymbol } from '@/utils/shared/getCurrencySymbol';
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
	const { colors, isDark } = useTheme();
	const isIncome = transaction.type === 'INCOME';
	const accentColor = isIncome ? '#39AD6A' : '#ee1c1c';

	return (
		<View className='mb-2'>
			<BaseCard accentColor={accentColor}>
				<TouchableOpacity
					onLongPress={() => onDelete(transaction.id)}
					className='flex-row justify-between items-center p-2'
				>
					<View className='flex-row items-center flex-1 mr-3'>
						<Text className='mr-2 text-lg'>
							{getCategoryEmoji(transaction.categoryId)}
						</Text>
						<View className='flex-1'>
							<Text className='font-bold text-sm' style={{ color: colors.text }}>
								{getCategoryById(transaction.categoryId)?.name || transaction.description}
							</Text>
							<Text className='text-xs' style={{ color: colors.noActive }}>
								{format(new Date(transaction.date), 'dd/MM/yyyy')}
							</Text>
						</View>
					</View>
					<View className='flex-row items-center gap-2'>
						<View className='items-end'>
							<Text className='font-bold text-sm tabular-nums' style={{ color: accentColor }}>
								{isIncome ? '+' : '-'}{getCurrencySymbol(transaction.currency)}{transaction.amount.toFixed(2)}
							</Text>
							{transaction.description && transaction.description !== getCategoryById(transaction.categoryId)?.name && (
								<Text className='text-xs' style={{ color: colors.noActive }}>
									{transaction.description}
								</Text>
							)}
						</View>
						<TouchableOpacity
							onPress={() => onUpdate(transaction)}
							className='p-2 rounded-lg'
							style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
						>
							<MaterialCommunityIcons name='pencil' size={16} color={colors.noActive} />
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</BaseCard>
		</View>
	);
};

export default TransactionCard;
