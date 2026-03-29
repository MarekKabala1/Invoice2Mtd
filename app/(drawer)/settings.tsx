/**
 * settings.tsx
 *
 * Settings screen main orchestration file.
 *
 * Consolidates all app configuration: Tax, Invoice Numbers, MTD, Financial Year,
 * HMRC Rates, Appearance, Reminders, About.
 *
 * Features:
 * - Multi-user support with user selector dropdown
 * - Save/Cancel pattern (changes persist only on explicit Save)
 * - Unsaved changes warning banner
 * - Default value safety (applyDefaults utility)
 *
 * Depends on: context/AppSettingsContext, utils/settingsOperations,
 *             components (SectionHeader, SettingsRow, etc)
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getAllUsers } from '@/utils/settings/settingsOperations';
import { AppSettingsType, appSettingsSchema } from '@/db/zodSchema';
import { User } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';
import { getChangedFields } from '@/utils/settings/diffSettings';
import {
	TaxSettingsSection,
	InvoiceSettingsSection,
	MTDSettingsSection,
	FinancialYearSection,
	HMRCRatesSection,
	AppearanceSection,
	RemindersSection,
	AboutSection,
} from './settings/sections';

type UserType = InferSelectModel<typeof User>;

const SETTINGS_KEYS = Object.keys(appSettingsSchema.shape) as (keyof AppSettingsType)[];

export default function SettingsScreen() {
	const { colors, isDark } = useTheme();
	const { settings, selectedUserId, loadUserSettings, update } = useAppSettings();

	// State
	const [formState, setFormState] = useState<Partial<AppSettingsType>>({});
	const [users, setUsers] = useState<UserType[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [showUserPicker, setShowUserPicker] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Check for unsaved changes
	const hasChanges = useMemo(() => {
		return JSON.stringify(formState) !== JSON.stringify(settings);
	}, [formState, settings]);

	// Load users on mount
	useEffect(() => {
		loadUsers();
	}, []);

	// Initialize form state when settings change
	useEffect(() => {
		if (settings) {
			setFormState({ ...settings });
		}
	}, [settings]);

	// WHY: Support multi-user settings selection with unsaved changes protection
	const loadUsers = async () => {
		try {
			const allUsers = await getAllUsers();
			setUsers(allUsers);
			if (allUsers.length > 0 && !selectedUserId) {
				await loadUserSettings(allUsers[0].id);
			}
		} catch {
			Alert.alert('Error', 'Failed to load users');
		} finally {
			setLoadingUsers(false);
		}
	};

	const handleUserSelect = async (userId: string) => {
		if (hasChanges) {
			Alert.alert('Unsaved Changes', 'You have unsaved changes. Discard them?', [
				{ text: 'Cancel', onPress: () => {}, style: 'cancel' },
				{
					text: 'Discard',
					onPress: async () => {
						await loadUserSettings(userId);
						setShowUserPicker(false);
					},
					style: 'destructive',
				},
			]);
		} else {
			await loadUserSettings(userId);
			setShowUserPicker(false);
		}
	};

	// WHY: Batch all changes into single database update to minimize writes.
	// Uses getChangedFields to compute only the fields that actually changed.
	const handleSave = async () => {
		if (!settings) return;

		setIsSaving(true);
		try {
			const updatePayload = getChangedFields<AppSettingsType>(formState, settings, SETTINGS_KEYS);

			if (Object.keys(updatePayload).length > 0) {
				await update(updatePayload);
				setFormState((prev) => ({ ...prev, ...updatePayload }));
				Alert.alert('Success', 'Your settings have been saved');
			} else {
				Alert.alert('No Changes', 'No settings were modified');
			}
		} catch {
			Alert.alert('Error', 'Failed to save settings. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		if (hasChanges) {
			Alert.alert('Discard changes?', 'Are you sure you want to discard your changes?', [
				{ text: 'Keep editing', onPress: () => {}, style: 'cancel' },
				{
					text: 'Discard',
					onPress: () => {
						if (settings) {
							setFormState({ ...settings });
						}
					},
					style: 'destructive',
				},
			]);
		}
	};

	const handleFieldChange = (field: keyof AppSettingsType, value: string | number | boolean | undefined) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
	};

	const selectedUser = users.find((u) => u.id === selectedUserId);

	if (loadingUsers) {
		return (
			<View className='flex-1 items-center justify-center' style={{ backgroundColor: colors.primary }}>
				<ActivityIndicator size='large' color={colors.text} />
			</View>
		);
	}

	return (
		<View className='flex-1' style={{ backgroundColor: colors.primary }}>
			{/* Unsaved changes warning */}
			{hasChanges && (
				<View className='bg-amber-100 px-4 py-2 flex-row items-center gap-2'>
					<Ionicons name='alert-circle' size={16} color={colors.warning} />
					<Text className='text-xs' style={{ color: colors.warning }}>
						You have unsaved changes
					</Text>
				</View>
			)}

			<ScrollView className='flex-1'>
				<View className='px-4 py-4'>
					{/* User selector */}
					<TouchableOpacity
						className='py-3 px-4 rounded-lg mb-4 flex-row items-center justify-between'
						style={{ backgroundColor: isDark ? colors.nav : colors.card }}
						onPress={() => setShowUserPicker(!showUserPicker)}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Settings For
						</Text>
						<View className='flex-row items-center gap-2'>
							<Text className='text-sm' style={{ color: colors.noActive }}>
								{selectedUser?.fullName || 'Select User'}
							</Text>
							<Ionicons name='chevron-down' size={16} color={colors.noActive} />
						</View>
					</TouchableOpacity>

					{/* User picker modal */}
					<Modal visible={showUserPicker} transparent animationType='fade' onRequestClose={() => setShowUserPicker(false)}>
						<View className='flex-1 bg-black/50 items-center justify-center'>
							<View className='w-80 rounded-lg overflow-hidden' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
								<FlatList
									data={users}
									keyExtractor={(item) => item.id}
									renderItem={({ item }) => (
										<TouchableOpacity
											className='py-3 px-4 border-b'
											style={{
												borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
											}}
											onPress={() => handleUserSelect(item.id)}>
											<Text style={{ color: colors.text }}>{item.fullName}</Text>
										</TouchableOpacity>
									)}
									scrollEnabled={users.length > 5}
									nestedScrollEnabled
								/>
							</View>
						</View>
					</Modal>

					{/* Settings sections */}
					<TaxSettingsSection formState={formState} onFieldChange={handleFieldChange} />
					<InvoiceSettingsSection formState={formState} onFieldChange={handleFieldChange} />
					<MTDSettingsSection formState={formState} onFieldChange={handleFieldChange} />
					<FinancialYearSection formState={formState} onFieldChange={handleFieldChange} />
					<HMRCRatesSection formState={formState} onFieldChange={handleFieldChange} />
					<AppearanceSection />
					<RemindersSection formState={formState} onFieldChange={handleFieldChange} />
					<AboutSection />
				</View>
			</ScrollView>

			{/* Save/Cancel buttons */}
			<View className='border-t flex-row gap-2 p-4' style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
				<TouchableOpacity
					className='flex-1 py-3 rounded-lg items-center'
					style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
					onPress={handleCancel}
					disabled={isSaving}>
					<Text className='text-sm font-bold' style={{ color: colors.text }}>
						Cancel
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					className='flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2'
					style={{
						backgroundColor: hasChanges
							? isDark
								? 'rgba(37, 99, 235, 0.8)'
								: 'rgba(29, 78, 216, 0.8)'
							: isDark
								? 'rgba(255,255,255,0.1)'
								: 'rgba(0,0,0,0.05)',
					}}
					onPress={handleSave}
					disabled={!hasChanges || isSaving}>
					{isSaving ? (
						<ActivityIndicator size='small' color='white' />
					) : (
						<>
							<Ionicons name='checkmark-done' size={16} color={hasChanges ? 'white' : colors.noActive} />
							<Text className='text-sm font-bold' style={{ color: hasChanges ? 'white' : colors.noActive }}>
								Save
							</Text>
						</>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
}
