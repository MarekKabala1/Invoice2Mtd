import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeToggle from './ThemeToggle';
import BaseCard from './BaseCard';
import { useTheme } from '@/context/ThemeContext';
import TransactionList from '@/components/TransactionList';
import { useBudgetData } from '@/hooks/useBudgetData';
import { Ionicons } from '@expo/vector-icons';

const BudgetScreen: React.FC = () => {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const budget = useBudgetData();

	return (
		<View
			className='flex-1 bg-light-primary dark:bg-dark-primary'
			style={{ paddingTop: insets.top }}>
			<View className='flex-1 gap-2 p-2 mb-20'>
				<View className='w-full items-end'>
					<ThemeToggle size={30} />
				</View>
				<BaseCard>
					<View className='flex-row justify-between items-center'>
						<TouchableOpacity
							onPress={budget.handlePreviousMonth}
							className='p-2'>
							<Ionicons name='chevron-back' size={24} color={colors.text} />
						</TouchableOpacity>
						<Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
							{format(budget.currentDate, 'MMMM yyyy')}
						</Text>
						<TouchableOpacity onPress={budget.handleNextMonth} className='p-2'>
							<Ionicons name='chevron-forward' size={24} color={colors.text} />
						</TouchableOpacity>
					</View>
					<View className='flex-row justify-between items-center mb-2'>
						<Text className='text-success font-semibold'>
							Income: £{budget.totalIncomeForTheMonth.toFixed(2)}
						</Text>
						<Text className='text-danger font-semibold'>
							Expenses: £{budget.totalExpensesForTheMonth.toFixed(2)}
						</Text>
					</View>
					<View className='flex-col justify-between items-start mb-2'>
						<Text className='text-light-text dark:text-dark-text font-bold text-xl'>
							Total: £{budget.monthlyBalance.toFixed(2)}
						</Text>
						<Text className='text-light-text dark:text-dark-text font-bold text-xs pl-1'>
							Balance: £{budget.previousBalance.toFixed(2)}
						</Text>
					</View>
				</BaseCard>
				<TransactionList budget={budget} />
			</View>
		</View>
	);
};

export default BudgetScreen;
