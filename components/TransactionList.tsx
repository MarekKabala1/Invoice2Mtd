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
	const { colors, isDark } = useTheme();

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
			<View className='flex-row justify-between items-center mb-2 px-1'>
				<TouchableOpacity
					onPress={budget.openSearch}
					className='flex-row gap-1 items-center py-2 px-3 rounded-lg'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				>
					<Ionicons name='search' size={20} color={colors.text} />
					<Text className='text-xs font-bold' style={{ color: colors.text }}>
						Search
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => router.push('/(stack)/addTransaction')}
					className='flex-row gap-1 items-center py-2 px-3 rounded-lg'
					style={{
						backgroundColor: isDark ? '#4f46e5' : '#4338ca',
						shadowColor: '#4f46e5',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.3,
						shadowRadius: 4,
						elevation: 4,
					}}
				>
					<Ionicons name='add-circle-outline' size={20} color='white' />
					<Text className='text-xs font-bold text-white'>
						Add Budget
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={budget.handleToday}
					className='flex-row gap-1 items-center py-2 px-3 rounded-lg'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				>
					<MaterialCommunityIcons name='calendar-today' size={20} color={colors.text} />
					<Text className='text-xs font-bold' style={{ color: colors.text }}>
						Today
					</Text>
				</TouchableOpacity>
			</View>

			{budget.openSearchInput && (
				<View className='gap-2 mb-2'>
					<View className='flex-row items-center gap-2'>
						<TouchableOpacity
							className='flex-row items-center gap-1 px-3 py-2 rounded-lg'
							style={{
								backgroundColor: budget.filterByTransactionType === 'INCOME'
									? '#39AD6A'
									: isDark ? colors.nav : colors.card,
							}}
							onPress={() => budget.handleFilterChange(budget.filterByTransactionType === 'INCOME' ? '' : 'INCOME')}
						>
							<Text
								className='font-bold text-xs'
								style={{ color: budget.filterByTransactionType === 'INCOME' ? 'white' : colors.text }}
							>
								Income
							</Text>
							{budget.filterByTransactionType === 'INCOME' && (
								<Ionicons name='close-sharp' size={14} color='white' />
							)}
						</TouchableOpacity>
						<TouchableOpacity
							className='flex-row items-center gap-1 px-3 py-2 rounded-lg'
							style={{
								backgroundColor: budget.filterByTransactionType === 'EXPENSE'
									? '#ee1c1c'
									: isDark ? colors.nav : colors.card,
							}}
							onPress={() => budget.handleFilterChange(budget.filterByTransactionType === 'EXPENSE' ? '' : 'EXPENSE')}
						>
							<Text
								className='font-bold text-xs'
								style={{ color: budget.filterByTransactionType === 'EXPENSE' ? 'white' : colors.text }}
							>
								Expenses
							</Text>
							{budget.filterByTransactionType === 'EXPENSE' && (
								<Ionicons name='close-sharp' size={14} color='white' />
							)}
						</TouchableOpacity>
					</View>
					<View className='flex-row items-center gap-2 w-full p-2 rounded' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
						<TextInput
							onChangeText={budget.filterTransaction}
							value={budget.searchQuery}
							className='flex-1'
							style={{ color: colors.text }}
							placeholder='Search transactions'
							placeholderTextColor={colors.noActive}
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
					<Text className='text-center mt-8' style={{ color: colors.noActive }}>
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
