import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/config';
import { User, BankDetails } from '@/db/schema';
import { UserType, BankDetailsType } from '@/db/zodSchema';
import { eq } from 'drizzle-orm';
import UserList from './UserList';
import UserFormModal from './UserFormModal';
import BankDetailsFormModal from './BankDetailsFormModal';

const UserForm: React.FC = () => {
	const [users, setUsers] = useState<UserType[]>([]);
	const [bankDetails, setBankDetails] = useState<BankDetailsType[]>([]);
	const [userModalVisible, setUserModalVisible] = useState(false);
	const [bankModalVisible, setBankModalVisible] = useState(false);
	const [editingUser, setEditingUser] = useState<UserType | null>(null);
	const [editingBankDetails, setEditingBankDetails] =
		useState<BankDetailsType | null>(null);
	const { colors } = useTheme();

	const fetchUsers = async () => {
		const usersData = await db.select().from(User);
		setUsers(usersData as UserType[]);
		const bankDetailsData = await db.select().from(BankDetails);
		setBankDetails(bankDetailsData as BankDetailsType[]);
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const handleUserPress = (user: UserType) => {
		setEditingUser(user);
		setUserModalVisible(true);
	};

	const handleUserLongPress = (user: UserType) => {
		Alert.alert(
			'Delete User',
			`Are you sure you want to delete ${user.fullName}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						await db.delete(User).where(eq(User.id, user.id));
						await db.delete(BankDetails).where(eq(BankDetails.userId, user.id));
						fetchUsers();
					},
				},
			]
		);
	};

	const handleBankDetailsPress = (user: UserType) => {
		const details = bankDetails.find((bd) => bd.userId === user.id) || null;
		setEditingBankDetails(details);
		setBankModalVisible(true);
	};

	const handleBankDetailsLongPress = (details: BankDetailsType) => {
		Alert.alert(
			'Delete Bank Details',
			'Are you sure you want to delete these bank details?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						await db.delete(BankDetails).where(eq(BankDetails.id, details.id));
						fetchUsers();
					},
				},
			]
		);
	};

	const resetUserModal = () => {
		setEditingUser(null);
		setUserModalVisible(false);
	};
	const resetBankModal = () => {
		setEditingBankDetails(null);
		setBankModalVisible(false);
	};

	return (
		<View className='flex-1 gap-4 p-4'>
			<View className=' justify-center items-end'>
				<TouchableOpacity
					onPress={() => setUserModalVisible(true)}
					className='flex-row items-center gap-2 bg-primary px-4 py-3 rounded-md'>
					<Ionicons name='add-circle-outline' size={24} color={colors.text} />
					<Text className='text-light-text dark:text-dark-text font-semibold'>
						Add New User
					</Text>
				</TouchableOpacity>
			</View>
			<UserList
				users={users}
				bankDetails={bankDetails}
				onUserPress={handleUserPress}
				onUserLongPress={handleUserLongPress}
				onBankDetailsPress={handleBankDetailsPress}
				onBankDetailsLongPress={handleBankDetailsLongPress}
			/>
			<UserFormModal
				visible={userModalVisible}
				onClose={resetUserModal}
				user={editingUser}
				onSuccess={() => {
					resetUserModal();
					fetchUsers();
				}}
			/>
			<BankDetailsFormModal
				visible={bankModalVisible}
				onClose={resetBankModal}
				bankDetails={editingBankDetails}
				userId={editingUser?.id}
				onSuccess={() => {
					resetBankModal();
					fetchUsers();
				}}
			/>
			<View className='flex-row justify-between'>
				<Text className='text-xs text-light-text dark:text-dark-text text-center'>
					*You can add multiple Users
				</Text>
				<Text className='text-xs text-light-text dark:text-dark-text text-center'>
					*Long Press to Delete
				</Text>
			</View>
		</View>
	);
};

export default UserForm;
