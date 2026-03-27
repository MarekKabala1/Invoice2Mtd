import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { db } from '@/db/config';
import { User } from '@/db/schema';
import { TransactionType } from '@/db/zodSchema';
import currencyData from '@/assets/currency.json';

export const useTransaction = () => {
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const [currencies, setCurrencies] = useState<{ label: string; value: string }[]>([]);

  const getCurrencies = async () => {
    const currencies = currencyData.map((currency) => ({
      label: currency.currencyName,
      value: currency.currencyCode,
    }));
    setCurrencies(currencies);
  };

  const getUsers = async () => {
    try {
      const usersFromDb = await db.select().from(User);
      const formattedUsers = usersFromDb.map((user) => ({
        label: user.fullName || 'Unnamed User',
        value: user.id || '',
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error getting users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([getUsers(), getCurrencies()]);
    };

    initializeData();
  }, []);

  return {
    users,
    currencies,
  };
};