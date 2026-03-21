import { Alert } from 'react-native';
import { db } from '@/db/config';
import { Transactions } from '@/db/schema';
import { TransactionType } from '@/db/zodSchema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/utils/generateUuid';
import { router } from 'expo-router';

export const validateTransactionData = (data: TransactionType): boolean => {
  if (!data.userId) {
    Alert.alert('Error', 'Please select a user');
    return false;
  }
  if (!data.categoryId) {
    Alert.alert('Error', 'Please select a category');
    return false;
  }

  const amount = parseFloat(data.amount as unknown as string);
  if (isNaN(amount)) {
    Alert.alert('Error', 'Please enter a valid amount');
    return false;
  }

  return true;
};

export const handleSaveTransaction = async (data: TransactionType, isUpdateMode: boolean, transactionData?: TransactionType): Promise<void> => {
  try {
    if (!validateTransactionData(data)) {
      return;
    }

    const amount = parseFloat(data.amount as unknown as string);
    const id = await generateId();
    const transaction = {
      ...data,
      id: id,
      amount: amount,
      date: data.date,
      currency: 'GBP',
    };

    if (isUpdateMode && transactionData) {
      await db.update(Transactions).set(transaction).where(eq(Transactions.id, transactionData.id));
    } else {
      await db.insert(Transactions).values(transaction);
    }

    Alert.alert('Success', 'Transaction added successfully', [
      {
        text: 'OK',
        onPress: () => {
          router.back();
        },
      },
    ]);
  } catch (error) {
    console.error('Failed to add transaction:', error);
    Alert.alert('Error', 'Failed to add transaction. Please try again.');
  }
};