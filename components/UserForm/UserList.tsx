import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { UserType, BankDetailsType } from '@/db/zodSchema';
import { Ionicons } from '@expo/vector-icons';
import BaseCard from '../BaseCard';
import { useTheme } from '@/context/ThemeContext';

interface UserListProps {
	users: UserType[];
	bankDetails: BankDetailsType[];
	onUserPress: (user: UserType) => void;
	onUserLongPress: (user: UserType) => void;
	onBankDetailsPress: (user: UserType) => void;
	onBankDetailsLongPress: (details: BankDetailsType) => void;
}

const UserList: React.FC<UserListProps> = ({
	users,
	bankDetails,
	onUserPress,
	onUserLongPress,
	onBankDetailsPress,
	onBankDetailsLongPress,
}) => {
	const { colors } = useTheme();

	if (users.length === 0) {
		return (
			<View className='flex-1 justify-center items-center'>
				<Ionicons name='people-outline' size={64} color={colors.text} />
				<Text className='text-light-text dark:text-dark-text text-lg font-semibold mt-4'>
					No users yet
				</Text>
				<Text className='text-light-text dark:text-dark-text text-sm text-center mt-2 opacity-70'>
					Add your first user to get started
				</Text>
			</View>
		);
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View className='gap-3'>
				{users.map((user) => {
					const details = bankDetails.find((bd) => bd.userId === user.id);
					return (
						<BaseCard key={user.id}>
							<TouchableOpacity
								onPress={() => onUserPress(user)}
								onLongPress={() => onUserLongPress(user)}
								activeOpacity={0.7}>
								<View className='flex-row justify-between items-center'>
									<View>
										<Text className='text-light-text dark:text-dark-text text-lg font-semibold'>
											{user.fullName}
										</Text>
										<Text className='text-light-text dark:text-dark-text text-sm mt-1 opacity-70'>
											{user.address}
										</Text>
										<Text className='text-light-text dark:text-dark-text text-xs mt-1 opacity-70'>
											{user.emailAddress}
										</Text>
									</View>
									<View className='flex-row justify-center items-center gap-2'>
										<TouchableOpacity
											onPress={() => onBankDetailsPress(user)}
											onLongPress={() =>
												details && onBankDetailsLongPress(details)
											}>
											<Ionicons
												name='card-outline'
												size={24}
												color={colors.text}
											/>
											<Text className='text-xs text-light-text dark:text-dark-text'>
												{details ? details.bankName : 'No Bank'}
											</Text>
										</TouchableOpacity>
									</View>
								</View>
								<Text className='text-xs text-light-text dark:text-dark-text opacity-50 mt-2'>
									Tap to edit • Long press to delete
								</Text>
							</TouchableOpacity>
						</BaseCard>
					);
				})}
			</View>
		</ScrollView>
	);
};

export default UserList;
