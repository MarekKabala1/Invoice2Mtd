import React, { useRef } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	TextInput,
	FlatList,
	PanResponder,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TransactionCard from '@/components/TransactionCard';
import BaseCard from '@/components/BaseCard';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { TransactionType } from '@/db/zodSchema';

interface BudgetDataType {
	currentDate: Date;
	setCurrentDate: (date: Date) => void;
	transactions: TransactionType[];
	setTransactions: (transactions: TransactionType[]) => void;
	allTransactions: TransactionType[];
	openSearchInput: boolean;
	setOpenSearchInput: (open: boolean) => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filterByTransactionType: TransactionType['type'] | '';
	setFilterByTransactionType: (type: TransactionType['type'] | '') => void;
	previousBalance: number;
	overallBalance: { balance: number; income: number; expense: number };
	monthlyBalance: number;
	totalIncomeForTheMonth: number;
	totalExpensesForTheMonth: number;
	handlePreviousMonth: () => void;
	handleNextMonth: () => void;
	deleteTransaction: (transactionId: string) => Promise<void>;
	filterTransaction: (query: string) => void;
	handleFilterChange: (type: TransactionType['type'] | '') => void;
	openSearch: () => void;
	handleToday: () => void;
}

const TransactionList = ({ budget }: { budget: BudgetDataType }) => {
	const { colors } = useTheme();

	const handleUpdateTransaction = (transaction: TransactionType) => {
		router.push({
			pathname: '/addTransaction',
			params: {
				mode: 'update',
				transactionId: transaction.id,
				type: transaction.type,
				amount: transaction.amount.toString(),
				description: transaction.description,
				categoryId: transaction.categoryId,
				userId: transaction.userId,
				date: transaction.date,
				currency: transaction.currency,
			},
		});
	};

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: (evt, gestureState) => {
				return (
					Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
					Math.abs(gestureState.dx) > 20
				);
			},
			onPanResponderGrant: () => {
				return true;
			},
			onPanResponderMove: (evt, gestureState) => {},
			onPanResponderRelease: (evt, gestureState) => {
				if (gestureState.dx > 80) {
					budget.handlePreviousMonth();
				} else if (gestureState.dx < -80) {
					budget.handleNextMonth();
				}
			},
			onPanResponderTerminationRequest: () => false,
		})
	).current;

	return (
		<View style={{ flex: 1 }} {...panResponder.panHandlers}>
			<View className='flex-row justify-between items-center mb-2'>
				<TouchableOpacity
					onPress={budget.openSearch}
					className='flex-row gap-1 items-center'>
					<Ionicons name='search' size={24} color={colors.text} />
					<Text className='text-light-text dark:text-dark-text text-xs font-bold'>
						Search
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => router.push('/addTransaction')}
					className='flex-row gap-1 items-center'>
					<Ionicons name='add-circle-outline' size={24} color={colors.text} />
					<Text className='text-light-text dark:text-dark-text text-xs font-bold'>
						Add Budget
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={budget.handleToday}
					className='flex-row gap-1 items-center'>
					<MaterialCommunityIcons
						name='calendar-today'
						size={24}
						color={colors.text}
					/>
					<Text className='text-light-text dark:text-dark-text text-xs font-bold'>
						Today
					</Text>
				</TouchableOpacity>
			</View>

			{budget.openSearchInput && (
				<View className='gap-2'>
					<View className='flex-row items-center gap-2'>
						<BaseCard className='flex-row items-center gap-2'>
							{budget.filterByTransactionType === 'INCOME' ? (
								<TouchableOpacity
									className='flex-row items-center gap-2'
									onPress={() => budget.handleFilterChange('')}>
									<Text className='text-light-text dark:text-dark-text font-bold text-xs'>
										Income
									</Text>
									<Ionicons name='close-sharp' size={16} color={colors.text} />
								</TouchableOpacity>
							) : (
								<TouchableOpacity
									onPress={() => budget.handleFilterChange('INCOME')}>
									<Text className='text-light-text dark:text-dark-text font-bold text-xs'>
										Income
									</Text>
								</TouchableOpacity>
							)}
						</BaseCard>
						<BaseCard className='flex-row items-center gap-2'>
							{budget.filterByTransactionType === 'EXPENSE' ? (
								<TouchableOpacity
									className='flex-row items-center gap-2'
									onPress={() => budget.handleFilterChange('')}>
									<Text className='text-light-text dark:text-dark-text font-bold text-xs'>
										Expenses
									</Text>
									<Ionicons name='close-sharp' size={16} color={colors.text} />
								</TouchableOpacity>
							) : (
								<TouchableOpacity
									onPress={() => budget.handleFilterChange('EXPENSE')}>
									<Text className='text-light-text dark:text-dark-text font-bold text-xs'>
										Expenses
									</Text>
								</TouchableOpacity>
							)}
						</BaseCard>
					</View>
					<View className='flex-row items-center gap-2 w-full bg-light-nav dark:bg-dark-nav p-2 rounded text-light-text dark:text-dark-text text-sm'>
						<TextInput
							onChangeText={budget.filterTransaction}
							value={budget.searchQuery}
							className='w-[90%]'
							placeholder='Search'
							placeholderTextColor={colors.text}
						/>
						<TouchableOpacity onPress={() => budget.setOpenSearchInput(false)}>
							<Ionicons name='close-sharp' size={20} color={colors.text} />
						</TouchableOpacity>
					</View>
				</View>
			)}

			<FlatList
				data={budget.transactions}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<TransactionCard
						transaction={item}
						onDelete={budget.deleteTransaction}
						onUpdate={handleUpdateTransaction}
					/>
				)}
				ListEmptyComponent={
					<Text className='text-center text-light-text dark:text-dark-text mt-8'>
						No transactions found.
					</Text>
				}
				scrollEnabled={true}
				keyboardShouldPersistTaps='handled'
				onMoveShouldSetResponder={() => false}
				onStartShouldSetResponder={() => false}
			/>
		</View>
	);
};

export default TransactionList;
