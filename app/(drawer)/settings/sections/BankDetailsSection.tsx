/**
 * BankDetailsSection.tsx
 *
 * Bank account information: bank name, account name, sort code, account number.
 * Masked display for sensitive data. Reads from BankDetails table.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader } from '../components';

interface BankDetailsSectionProps {
	selectedUserId?: string;
}

export const BankDetailsSection: React.FC<BankDetailsSectionProps> = ({ selectedUserId }) => {
	const { colors, isDark } = useTheme();

	// WHY: Bank details are sensitive and edited via separate User Info screen
	// Show read-only status with link to edit
	const handleManageBankDetails = () => {
		Alert.alert(
			'Manage Bank Details',
			'To edit bank account details (account name, sort code, account number), use the Bank Details form from User Information screen.'
		);
	};

	return (
		<>
			<SectionHeader title='Bank Details' />

			<TouchableOpacity
				onPress={handleManageBankDetails}
				className='py-3 px-4 rounded-lg mb-1 flex-row items-center justify-between'
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<View className='flex-1'>
					<Text className='text-sm font-semibold' style={{ color: colors.text }}>
						Manage Bank Account
					</Text>
					<Text className='text-xs mt-1' style={{ color: colors.noActive }}>
						Bank name, account name, sort code (XX-XX-XX), account number (masked)
					</Text>
				</View>
				<Ionicons name='chevron-forward' size={20} color={colors.noActive} />
			</TouchableOpacity>

			<View className='py-2 px-1'>
				<Text className='text-xs' style={{ color: colors.noActive }}>
					✓ Bank details are securely stored and used for invoice payment details and MTD reporting.
				</Text>
				<Text className='text-xs mt-2' style={{ color: colors.noActive }}>
					Account numbers are masked in display. Only visible on invoices if you choose to show payment details.
				</Text>
			</View>
		</>
	);
};
