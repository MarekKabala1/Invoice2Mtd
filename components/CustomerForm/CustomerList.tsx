import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { PhoneNumber } from '../PhoneNumber';
import { CustomerType } from '@/db/zodSchema';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { EmailAddress } from '../Email';
import BaseCard from '../BaseCard';

interface CustomerListProps {
	customers: CustomerType[];
	onCustomerPress?: (customer: CustomerType) => void;
	onCustomerLongPress?: (customer: CustomerType) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
	customers,
	onCustomerPress,
	onCustomerLongPress,
}) => {
	const { colors } = useTheme();

	if (customers.length === 0) {
		return (
			<View className='flex-1 justify-center items-center'>
				<Ionicons name='people-outline' size={64} color={colors.text} />
				<Text className='text-light-text dark:text-dark-text text-lg font-semibold mt-4'>
					No customers yet
				</Text>
				<Text className='text-light-text dark:text-dark-text text-sm text-center mt-2 opacity-70'>
					Add your first customer to get started
				</Text>
			</View>
		);
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View className='gap-3'>
				{customers.map((customer) => (
					<BaseCard key={customer.id}>
						<TouchableOpacity
							key={customer.id}
							onPress={() => onCustomerPress?.(customer)}
							onLongPress={() => onCustomerLongPress?.(customer)}
							activeOpacity={0.7}>
							<View className='flex-row justify-between items-start'>
								<View>
									<Text className='text-light-text dark:text-dark-text text-lg font-semibold'>
										{customer.name}
									</Text>
									{customer.address && (
										<Text className='text-light-text dark:text-dark-text text-sm mt-1 opacity-70'>
											{customer.address}
										</Text>
									)}
									<View className='flex-row items-center mt-2 gap-4'>
										{customer.emailAddress && (
											<View className='flex-row items-center'>
												<EmailAddress
													email={customer.emailAddress}
													customerName={customer.name}
												/>
											</View>
										)}
										{customer.phoneNumber && (
											<View className='flex-row items-center'>
												<PhoneNumber
													phoneNumber={customer.phoneNumber}
													customerName={customer.name}
												/>
											</View>
										)}
									</View>
								</View>
								<View className='flex-row items-center gap-2'>
									<Ionicons
										name='create-outline'
										size={16}
										color={colors.text}
									/>
									<Ionicons
										name='chevron-forward'
										size={20}
										color={colors.text}
									/>
								</View>
							</View>
							<Text className='text-xs text-light-text dark:text-dark-text opacity-50 mt-2'>
								Tap to edit • Long press to delete
							</Text>
						</TouchableOpacity>
					</BaseCard>
				))}
			</View>
		</ScrollView>
	);
};
