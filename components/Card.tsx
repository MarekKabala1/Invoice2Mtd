import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { db } from '@/db/config';
import { User, Customer, BankDetails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UserType, BankDetailsType, CustomerType } from '@/db/zodSchema';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import BaseCard from './BaseCard';
import { router } from 'expo-router';
import { color } from '@/utils/theme';
import { useTheme } from '@/context/ThemeContext';

interface UserWithBankDetails extends UserType {
	bankDetails?: BankDetailsType | null;
}

export default function UsersCard({ users, bankDetails, customers }: { users?: UserType[]; bankDetails?: BankDetailsType[]; customers?: CustomerType[] }) {
	const [usersWithBankDetails, setUsersWithBankDetails] = useState<UserWithBankDetails[]>([]);
	const [dbCustomers, setDbCustomers] = useState<CustomerType[]>([]);
	const [updateModalVisible, setUpdateModalVisible] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const { colors } = useTheme();

	// Function to find the bank details for a specific user
	const getBankDetailsForUser = (userId: string) => {
		return bankDetails?.find((details) => details.userId === userId) || null;
	};

	const deleteUser = async (userId: string) => {
		try {
			await db.delete(User).where(eq(User.id, userId));
			await db.delete(BankDetails).where(eq(BankDetails.userId, userId));
			setUsersWithBankDetails((prevUsers) => prevUsers.filter((user) => user.id !== userId));
		} catch (e) {
			throw new Error(`There is problem to delete User ${e}`);
		}
	};

	const deleteCustomer = async (customerId: string) => {
		try {
			await db.delete(Customer).where(eq(Customer.id, customerId));
			setDbCustomers((prevCustomers) => prevCustomers.filter((customer) => customer.id !== customerId));
		} catch (e) {
			throw new Error(`There is problem to delete Customer ${e}`);
		}
	};

	useEffect(() => {
		const mappedUsers = users?.map((user) => ({
			...user,
			bankDetails: getBankDetailsForUser(user.id),
		}));
		setUsersWithBankDetails(mappedUsers as UserWithBankDetails[]);
		const mappedCustomers = customers?.map((customer) => ({
			...customer,
		}));
		setDbCustomers(mappedCustomers as CustomerType[]);
	}, [users, bankDetails, customers]);

	const updateUser = async (userId: string) => {
		setUpdateModalVisible(false);
		const users = await db.select().from(User);
		const user = users.find((usr) => usr.id === userId);
		if (user) {
			router.replace({
				pathname: '/(user)/userInfo',
				params: {
					mode: 'update',
					type: 'user',
					id: user.id,
					fullName: user.fullName,
					address: user.address,
					emailAddress: user.emailAddress,
					phoneNumber: user.phoneNumber,
					utrNumber: user.utrNumber,
					ninNumber: user.ninNumber,
					createAt: user.createdAt,
				},
			});
		}
	};

	const updateBankDetails = async (userId: string) => {
		setUpdateModalVisible(false);
		const bankDetails = await db.select().from(BankDetails);
		const bankDetail = bankDetails.find((usr) => usr.userId === userId);
		if (bankDetail) {
			router.replace({
				pathname: '/(user)/userInfo',
				params: {
					mode: 'update',
					type: 'bankDetails',
					id: bankDetail.id,
					userId: bankDetail.userId,
					accountName: bankDetail.accountName,
					sortCode: bankDetail.sortCode,
					accountNumber: bankDetail.accountNumber,
					bankName: bankDetail.bankName,
					createAt: bankDetail.createdAt,
				},
			});
		}
	};
	const updateCustomer = async (customerId: string) => {
		const customers = await db.select().from(Customer);
		const customer = customers.find((cst) => cst.id === customerId);
		if (customer) {
			router.replace({
				pathname: '/clientInfo',
				params: {
					mode: 'update',
					customerId: customer.id,
					customerName: customer.name,
					address: customer.address,
					email: customer.emailAddress,
					phoneNumber: customer.phoneNumber,
				},
			});
		}
	};

	const [modalPosition, setModalPosition] = useState({ top: 0 });

	const toggleModal = useCallback(
		(event: { nativeEvent: { pageY: number } }, userId?: string) => {
			if (!updateModalVisible) {
				const { pageY } = event.nativeEvent;
				setModalPosition({ top: pageY });
				setSelectedUserId(userId as string);
				setUpdateModalVisible(true);
			} else {
				setUpdateModalVisible(false);
				setSelectedUserId(null);
			}
		},
		[updateModalVisible]
	);

	return (
		<View>
			{usersWithBankDetails &&
				usersWithBankDetails.map((item) => (
					<BaseCard key={item.id} className='mb-4 relative  '>
						<TouchableOpacity onLongPress={() => deleteUser(item.id)} className='flex-row justify-between items-center'>
							<Text className='text-lg font-bold text-light-text dark:text-dark-text px-2'>{item.fullName}</Text>
							<View className='flex-row items-center gap-10'>
								<View className='text-xs text-light-text dark:text-dark-text'>
									{item.bankDetails ? (
										<Text className='text-xs text-light-text dark:text-dark-text'>{item.bankDetails.bankName}</Text>
									) : (
										<Text className='text-xs text-danger'>Bank details not added</Text>
									)}
								</View>
								<View className='flex-row'>
									<TouchableOpacity onPress={(e) => toggleModal(e, item.id)}>
										<View className='bg-light-nav dark:bg-dark-nav border border-light-text dark:border-dark-text rounded-md p-1 '>
											<MaterialCommunityIcons name='update' size={24} color={colors.text} />
										</View>
									</TouchableOpacity>
									<Modal animationType='fade' transparent={true} visible={updateModalVisible} onRequestClose={() => setUpdateModalVisible(false)}>
										<TouchableOpacity className='flex-1 bg-light-text/10 dark:bg-dark-text/10' activeOpacity={1} onPress={toggleModal}>
											<TouchableOpacity
												activeOpacity={1}
												onPress={(e) => e.stopPropagation()}
												style={{
													top: modalPosition.top,
												}}
												className='grid grid-cols-2 justify-start absolute right-5  gap-4 bg-light-primary dark:bg-dark-primary border border-light-text dark:border-dark-text rounded-md p-4 shadow-lg elevation-lg'>
												<TouchableOpacity onPress={() => updateUser(selectedUserId as string)} className='flex-row gap-4 items-center justify-start '>
													<FontAwesome style={{ paddingRight: 7 }} name='user-o' size={20} color={colors.text} />
													<Text className='text-light-text dark:text-dark-text font-bold '>User</Text>
												</TouchableOpacity>
												<TouchableOpacity onPress={() => updateBankDetails(selectedUserId as string)} className='flex-row gap-4 items-center justify-start'>
													<FontAwesome name='bank' size={20} color={colors.text} />
													<Text className='text-light-text dark:text-dark-text font-bold'> Bank Details</Text>
												</TouchableOpacity>
											</TouchableOpacity>
										</TouchableOpacity>
									</Modal>
								</View>
							</View>
						</TouchableOpacity>
					</BaseCard>
				))}
			{dbCustomers &&
				dbCustomers.map((item) => (
					<BaseCard key={item.id} className='mb-4'>
						<TouchableOpacity onLongPress={() => deleteCustomer(item.id as string)} className='flex-row justify-between items-center  '>
							<Text className='text-lg font-bold text-light-text dark:text-dark-text'>{item.name}</Text>
							<View className='flex-row gap-2'>
								<TouchableOpacity onPress={() => updateCustomer(item.id as string)}>
									<View className='bg-light-nav dark:bg-dark-nav border border-light-text dark:border-dark-text rounded-md text-light-text dark:text-dark-text shadow-sm shadow-slate-400 p-2'>
										<MaterialCommunityIcons name='update' size={20} color={colors.text} />
									</View>
								</TouchableOpacity>
							</View>
						</TouchableOpacity>
					</BaseCard>
				))}
		</View>
	);
}
