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
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Modal,
	FlatList,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getAllUsers } from '@/utils/settingsOperations';
import { AppSettingsType } from '@/db/zodSchema';
import { User } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';
import { applyDefaults } from './settings/utils';
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
import { parseTaxRates, serializeTaxRates } from '@/utils/mtdTaxCalc';

type UserType = InferSelectModel<typeof User>;

export default function SettingsScreen() {
	const { colors, isDark } = useTheme();
	const { settings, selectedUserId, loadUserSettings, update } = useAppSettings();

	// State
	const [formState, setFormState] = useState<Partial<AppSettingsType>>({});
	const [users, setUsers] = useState<UserType[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [showUserPicker, setShowUserPicker] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Compute derived state with defaults applied for safety
	const safeSettings = useMemo(() => applyDefaults(settings), [settings]);

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
			setFormState({
				defaultVatRate: settings.defaultVatRate,
				taxScheme: settings.taxScheme,
				applyTaxByDefault: settings.applyTaxByDefault,
				defaultPaymentTerms: settings.defaultPaymentTerms,
				invoicePrefix: settings.invoicePrefix,
				nextInvoiceNumber: settings.nextInvoiceNumber,
				estimatePrefix: settings.estimatePrefix,
				nextEstimateNumber: settings.nextEstimateNumber,
				quarterlyTaxEnabled: settings.quarterlyTaxEnabled,
				autoCalculateQuarters: settings.autoCalculateQuarters,
				quarterlyTaxReminderDays: settings.quarterlyTaxReminderDays,
				quarterStartMonths: settings.quarterStartMonths,
				reminderEmailEnabled: settings.reminderEmailEnabled,
				reminderDaysBeforeDue: settings.reminderDaysBeforeDue,
				currency: settings.currency,
				dateFormat: settings.dateFormat,
				numberFormat: settings.numberFormat,
				language: settings.language,
				theme: settings.theme,
				logoUrl: settings.logoUrl,
				defaultNotes: settings.defaultNotes,
				financialYearStartMonth: settings.financialYearStartMonth,
				financialYearStartDay: settings.financialYearStartDay,
				financialYearEndMonth: settings.financialYearEndMonth,
				financialYearEndDay: settings.financialYearEndDay,
				taxRatesJson: settings.taxRatesJson,
			});
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
		} catch (err) {
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

	// WHY: Batch all changes into single database update to minimize writes
	const handleSave = async () => {
		if (!settings) return;

		setIsSaving(true);
		try {
			const updatePayload: Partial<AppSettingsType> = {};

			// Only include fields that changed
			if (formState.defaultVatRate !== settings.defaultVatRate)
				updatePayload.defaultVatRate = formState.defaultVatRate;
			if (formState.taxScheme !== settings.taxScheme) updatePayload.taxScheme = formState.taxScheme;
			if (formState.applyTaxByDefault !== settings.applyTaxByDefault)
				updatePayload.applyTaxByDefault = formState.applyTaxByDefault;
			if (formState.defaultPaymentTerms !== settings.defaultPaymentTerms)
				updatePayload.defaultPaymentTerms = formState.defaultPaymentTerms;
			if (formState.invoicePrefix !== settings.invoicePrefix)
				updatePayload.invoicePrefix = formState.invoicePrefix;
			if (formState.nextInvoiceNumber !== settings.nextInvoiceNumber)
				updatePayload.nextInvoiceNumber = formState.nextInvoiceNumber;
			if (formState.estimatePrefix !== settings.estimatePrefix)
				updatePayload.estimatePrefix = formState.estimatePrefix;
			if (formState.nextEstimateNumber !== settings.nextEstimateNumber)
				updatePayload.nextEstimateNumber = formState.nextEstimateNumber;
			if (formState.quarterlyTaxEnabled !== settings.quarterlyTaxEnabled)
				updatePayload.quarterlyTaxEnabled = formState.quarterlyTaxEnabled;
			if (formState.autoCalculateQuarters !== settings.autoCalculateQuarters)
				updatePayload.autoCalculateQuarters = formState.autoCalculateQuarters;
			if (formState.quarterlyTaxReminderDays !== settings.quarterlyTaxReminderDays)
				updatePayload.quarterlyTaxReminderDays = formState.quarterlyTaxReminderDays;
			if (formState.quarterStartMonths !== settings.quarterStartMonths)
				updatePayload.quarterStartMonths = formState.quarterStartMonths;
			if (formState.reminderEmailEnabled !== settings.reminderEmailEnabled)
				updatePayload.reminderEmailEnabled = formState.reminderEmailEnabled;
			if (formState.reminderDaysBeforeDue !== settings.reminderDaysBeforeDue)
				updatePayload.reminderDaysBeforeDue = formState.reminderDaysBeforeDue;
			if (formState.currency !== settings.currency) updatePayload.currency = formState.currency;
			if (formState.dateFormat !== settings.dateFormat) updatePayload.dateFormat = formState.dateFormat;
			if (formState.numberFormat !== settings.numberFormat)
				updatePayload.numberFormat = formState.numberFormat;
			if (formState.language !== settings.language) updatePayload.language = formState.language;
			if (formState.theme !== settings.theme) updatePayload.theme = formState.theme;
			if (formState.logoUrl !== settings.logoUrl) updatePayload.logoUrl = formState.logoUrl;
			if (formState.defaultNotes !== settings.defaultNotes)
				updatePayload.defaultNotes = formState.defaultNotes;
			if (formState.financialYearStartMonth !== settings.financialYearStartMonth)
				updatePayload.financialYearStartMonth = formState.financialYearStartMonth;
			if (formState.financialYearStartDay !== settings.financialYearStartDay)
				updatePayload.financialYearStartDay = formState.financialYearStartDay;
			if (formState.financialYearEndMonth !== settings.financialYearEndMonth)
				updatePayload.financialYearEndMonth = formState.financialYearEndMonth;
			if (formState.financialYearEndDay !== settings.financialYearEndDay)
				updatePayload.financialYearEndDay = formState.financialYearEndDay;
			if (formState.taxRatesJson !== settings.taxRatesJson)
				updatePayload.taxRatesJson = formState.taxRatesJson;

			if (Object.keys(updatePayload).length > 0) {
				await update(updatePayload);

				// WHY: Merge updates into formState immediately to clear unsaved changes
				// while context updates settings asynchronously
				const mergedState = { ...formState, ...updatePayload };
				setFormState(mergedState);

				Alert.alert('✅ Success', 'Your settings have been saved');
			} else {
				Alert.alert('ℹ️ No Changes', 'No settings were modified');
			}
		} catch (err) {
			Alert.alert('❌ Error', 'Failed to save settings. Please try again.');
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
						// Reset form state to database values
						if (settings) {
							setFormState(settings);
						}
					},
					style: 'destructive',
				},
			]);
		}
	};

	const handleFieldChange = (field: keyof AppSettingsType, value: any) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
	};

	const selectedUser = users.find((u) => u.id === selectedUserId);

	if (loadingUsers) {
		return (
			<View
				className="flex-1 items-center justify-center"
				style={{ backgroundColor: colors.primary }}
			>
				<ActivityIndicator size="large" color={colors.text} />
			</View>
		);
	}

	return (
		<View className="flex-1" style={{ backgroundColor: colors.primary }}>
			{/* Unsaved changes warning */}
			{hasChanges && (
				<View className="bg-amber-100 px-4 py-2 flex-row items-center gap-2">
					<Ionicons name="alert-circle" size={16} color="#92400e" />
					<Text className="text-xs" style={{ color: '#92400e' }}>
						You have unsaved changes
					</Text>
				</View>
			)}

			<ScrollView className="flex-1">
				<View className="px-4 py-4">
					{/* User selector */}
					<TouchableOpacity
						className="py-3 px-4 rounded-lg mb-4 flex-row items-center justify-between"
						style={{ backgroundColor: isDark ? colors.nav : colors.card }}
						onPress={() => setShowUserPicker(!showUserPicker)}
					>
						<Text className="text-sm font-bold" style={{ color: colors.text }}>
							Settings For
						</Text>
						<View className="flex-row items-center gap-2">
							<Text className="text-sm" style={{ color: colors.noActive }}>
								{selectedUser?.fullName || 'Select User'}
							</Text>
							<Ionicons name="chevron-down" size={16} color={colors.noActive} />
						</View>
					</TouchableOpacity>

					{/* User picker modal */}
					<Modal
						visible={showUserPicker}
						transparent
						animationType="fade"
						onRequestClose={() => setShowUserPicker(false)}
					>
						<View className="flex-1 bg-black/50 items-center justify-center">
							<View
								className="w-80 rounded-lg overflow-hidden"
								style={{ backgroundColor: isDark ? colors.nav : colors.card }}
							>
								<FlatList
									data={users}
									keyExtractor={(item) => item.id}
									renderItem={({ item }) => (
										<TouchableOpacity
											className="py-3 px-4 border-b"
											style={{
												borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
											}}
											onPress={() => handleUserSelect(item.id)}
										>
											<Text style={{ color: colors.text }}>{item.fullName}</Text>
										</TouchableOpacity>
									)}
									scrollEnabled={users.length > 5}
									nestedScrollEnabled
								/>
							</View>
						</View>
					</Modal>

					{/* All settings sections */}
					<TaxSettingsSection
						formState={formState}
						onFieldChange={handleFieldChange}
					/>
					<InvoiceSettingsSection
						formState={formState}
						onFieldChange={handleFieldChange}
					/>
					<MTDSettingsSection formState={formState} onFieldChange={handleFieldChange} />
					<FinancialYearSection
						formState={formState}
						onFieldChange={handleFieldChange}
					/>
					<HMRCRatesSection formState={formState} onFieldChange={handleFieldChange} />
					<AppearanceSection />
					<RemindersSection formState={formState} onFieldChange={handleFieldChange} />
					<AboutSection />
				</View>
			</ScrollView>

			{/* Save/Cancel buttons */}
			<View className="border-t flex-row gap-2 p-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
				<TouchableOpacity
					className="flex-1 py-3 rounded-lg items-center"
					style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
					onPress={handleCancel}
					disabled={isSaving}
				>
					<Text className="text-sm font-bold" style={{ color: colors.text }}>
						Cancel
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					className="flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2"
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
					disabled={!hasChanges || isSaving}
				>
					{isSaving ? (
						<ActivityIndicator size="small" color="white" />
					) : (
						<>
							<Ionicons name="checkmark-done" size={16} color={hasChanges ? 'white' : colors.noActive} />
							<Text
								className="text-sm font-bold"
								style={{ color: hasChanges ? 'white' : colors.noActive }}
							>
								Save
							</Text>
						</>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
}
