import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	TouchableOpacity,
	Modal,
	SafeAreaView,
	Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { customerSchema, CustomerType } from '@/db/zodSchema';
import {
	handleSaveCustomer,
	getCustomers,
	handleDeleteCustomer,
} from '@/utils/customerOperations';
import { CustomerList, CustomerFormModal } from './index';

interface CustomerFormProps {
	isUpdateMode?: boolean;
	customerData?: CustomerType;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
	isUpdateMode = false,
	customerData,
}) => {
	const [modalVisible, setModalVisible] = useState(false);
	const [customers, setCustomers] = useState<CustomerType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<CustomerType | null>(
		null
	);

	const { colors } = useTheme();

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors },
	} = useForm<CustomerType>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			name: '',
			address: '',
			emailAddress: '',
			phoneNumber: '',
		},
	});

	const fetchCustomers = async () => {
		try {
			const customersData = await getCustomers();
			setCustomers(customersData);
		} catch (error) {
			console.error('Error fetching customers:', error);
		}
	};

	useEffect(() => {
		fetchCustomers();
	}, []);

	useEffect(() => {
		if (isUpdateMode && customerData) {
			setEditingCustomer(customerData);
			setModalVisible(true);
			setValue('name', customerData.name);
			setValue('address', customerData.address || '');
			setValue('emailAddress', customerData.emailAddress);
			setValue('phoneNumber', customerData.phoneNumber || '');
		}
	}, [isUpdateMode, customerData, setValue]);

	const handleCustomerPress = (customer: CustomerType) => {
		setEditingCustomer(customer);
		setValue('name', customer.name);
		setValue('address', customer.address || '');
		setValue('emailAddress', customer.emailAddress);
		setValue('phoneNumber', customer.phoneNumber || '');
		setModalVisible(true);
	};

	const handleCustomerLongPress = (customer: CustomerType) => {
		Alert.alert(
			'Delete Customer',
			`Are you sure you want to delete ${customer.name}?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await handleDeleteCustomer(customer.id!);
							await fetchCustomers();
						} catch (error) {
							console.error('Error deleting customer:', error);
							Alert.alert('Error', 'Failed to delete customer');
						}
					},
				},
			]
		);
	};

	const handleSave = async (data: CustomerType): Promise<void> => {
		setIsLoading(true);
		try {
			await handleSaveCustomer(data, !!editingCustomer, editingCustomer?.id);
			reset();
			setModalVisible(false);
			setEditingCustomer(null);
			await fetchCustomers();
		} catch (error) {
			console.error('Error saving customer:', error);
			Alert.alert('Error', 'Failed to save customer');
		} finally {
			setIsLoading(false);
		}
	};

	const resetFormAndCloseModal = () => {
		reset({
			name: '',
			address: '',
			emailAddress: '',
			phoneNumber: '',
		});
		setModalVisible(false);
		setEditingCustomer(null);
	};

	return (
		<View className='flex-1 gap-4 p-4'>
			<View className=' justify-center items-end'>
				<TouchableOpacity
					onPress={() => setModalVisible(true)}
					className='flex-row items-center gap-2 bg-primary px-4 py-3 rounded-md'>
					<Ionicons name='add-circle-outline' size={24} color={colors.text} />
					<Text className='text-light-text dark:text-dark-text font-semibold'>
						Add New Customer
					</Text>
				</TouchableOpacity>
			</View>
			<CustomerList
				customers={customers}
				onCustomerPress={handleCustomerPress}
				onCustomerLongPress={handleCustomerLongPress}
			/>

			<CustomerFormModal
				modalVisible={modalVisible}
				onClose={resetFormAndCloseModal}
				onSubmit={handleSave}
				control={control}
				errors={errors}
				isUpdateMode={!!editingCustomer}
				isLoading={isLoading}
				handleSubmit={handleSubmit}
			/>

			<View className='flex-row justify-between'>
				<Text className='text-xs text-light-text dark:text-dark-text text-center'>
					*You can add multiple Customers
				</Text>
				<Text className='text-xs text-light-text dark:text-dark-text text-center'>
					*Long Press to Delete
				</Text>
			</View>
		</View>
	);
};

export default CustomerForm;
