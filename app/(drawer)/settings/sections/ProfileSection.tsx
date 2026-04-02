/**
 * ProfileSection.tsx
 *
 * User profile information: name, email, address, phone, UTR, NI (masked display).
 * Reads from User table, allows viewing and linking.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader, SettingsInputRow } from '../components';

interface ProfileSectionProps {
	selectedUserId?: string;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ selectedUserId }) => {
	const { colors, isDark } = useTheme();

	// WHY: Profile is managed via User selector at top of settings
	// This section just shows read-only linked user data
	const handleManageProfile = () => {
		Alert.alert(
			'Manage Profile',
			'To edit user profile (name, email, address, phone, UTR, NI), use the User Information screen from the main menu.'
		);
	};

	return (
		<>
			<SectionHeader title='Profile' />

			<TouchableOpacity
				onPress={handleManageProfile}
				className='py-3 px-4 rounded-lg mb-1 flex-row items-center justify-between'
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<View className='flex-1'>
					<Text className='text-sm font-semibold' style={{ color: colors.text }}>
						Manage User Information
					</Text>
					<Text className='text-xs mt-1' style={{ color: colors.noActive }}>
						Name, email, address, phone, UTR, NI
					</Text>
				</View>
				<Ionicons name='chevron-forward' size={20} color={colors.noActive} />
			</TouchableOpacity>

			<Text className='text-xs px-1 py-2' style={{ color: colors.noActive }}>
				Change the selected user at the top of settings to switch user profile context.
			</Text>
		</>
	);
};
