import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import TransactionForm from '@/components/TransactionForm';
import { TransactionType } from '@/db/zodSchema';

const AddTransactionPage: React.FC = () => {
	const params = useLocalSearchParams();
	const isUpdateMode = params.mode === 'update';
	const transactionData = isUpdateMode
		? {
				id: params.transactionId as string,
				type: params.type as 'EXPENSE' | 'INCOME',
				amount: parseFloat(params.amount as string),
				description: params.description as string,
				categoryId: params.categoryId as string,
				userId: params.userId as string,
				date: params.date as string,
				currency: 'GBP',
			}
		: undefined;

	return <TransactionForm isUpdateMode={isUpdateMode} transactionData={transactionData} />;
};

export default AddTransactionPage;
