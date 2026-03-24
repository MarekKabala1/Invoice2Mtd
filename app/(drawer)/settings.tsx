/**
 * settings.tsx
 *
 * Settings screen accessible from the drawer. Consolidates all app
 * configuration: Tax Defaults, Invoice Numbers, MTD & Tax, Appearance,
 * Reminders, About. Full Name and Bank Details moved to dedicated forms.
 *
 * Uses Save/Cancel pattern — changes are not persisted until Save is clicked.
 * Supports per-user settings via user selector dropdown.
 *
 * Depends on: context/AppSettingsContext, context/ThemeContext,
 *             hooks/useAppSettings, utils/settingsOperations
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, Linking, Alert, ActivityIndicator, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { formatGBP, RATES_2025_26, parseTaxRates, serializeTaxRates } from '@/utils/mtdTaxCalc';
import { TaxRates } from '@/types/mtd';
import { getAllUsers } from '@/utils/settingsOperations';
import { AppSettingsType } from '@/db/zodSchema';
import { User } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';
import ThemeToggle from '@/components/ThemeToggle';

type UserType = InferSelectModel<typeof User>;

function SectionHeader({ title }: { title: string }) {
	const { colors } = useTheme();
	return (
		<Text className='text-xs font-bold uppercase tracking-widest mt-6 mb-3' style={{ color: colors.noActive }}>
			{title}
		</Text>
	);
}

function SettingsRow({ label, value, onPress, showArrow = true }: { label: string; value?: string; onPress?: () => void; showArrow?: boolean }) {
	const { colors, isDark } = useTheme();
	return (
		<TouchableOpacity
			className='flex-row items-center justify-between py-3 px-4 rounded-lg mb-1'
			style={{ backgroundColor: isDark ? colors.nav : colors.card }}
			onPress={onPress}
			disabled={!onPress}>
			<Text className='text-sm flex-1' style={{ color: colors.text }}>
				{label}
			</Text>
			{value && (
				<Text className='text-sm mr-2' style={{ color: colors.noActive }}>
					{value}
				</Text>
			)}
			{showArrow && onPress && <Ionicons name='chevron-forward' size={16} color={colors.noActive} />}
		</TouchableOpacity>
	);
}

function SettingsToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (val: boolean) => void }) {
	const { colors, isDark } = useTheme();
	return (
		<View className='flex-row items-center justify-between py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
			<Text className='text-sm flex-1' style={{ color: colors.text }}>
				{label}
			</Text>
			<Switch
				value={value}
				onValueChange={onToggle}
				trackColor={{ false: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', true: '#39AD6A' }}
				thumbColor={value ? 'white' : isDark ? '#F3EDE2' : '#8B5E3C'}
			/>
		</View>
	);
}

function SettingsInputRow({
	label,
	value,
	onChangeText,
	placeholder,
	keyboardType = 'default',
	maxLength,
}: {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	keyboardType?: 'default' | 'numeric' | 'decimal-pad';
	maxLength?: number;
}) {
	const { colors, isDark } = useTheme();
	return (
		<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
			<Text className='text-xs mb-1' style={{ color: colors.noActive }}>
				{label}
			</Text>
			<TextInput
				className='text-sm p-0'
				style={{ color: colors.text }}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={colors.noActive}
				keyboardType={keyboardType}
				maxLength={maxLength}
			/>
		</View>
	);
}

interface FormState extends Partial<AppSettingsType> {}

export default function SettingsScreen() {
	const { colors, isDark } = useTheme();
	const { settings, loadUserSettings, update } = useAppSettings();

	// Users and selection state
	const [users, setUsers] = useState<UserType[]>([]);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [showUserPicker, setShowUserPicker] = useState(false);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Form state — mirrors database but allows editing before save
	const [formState, setFormState] = useState<FormState>({});

	// Tax rates state
	const [taxRates, setTaxRates] = useState<TaxRates>(settings ? parseTaxRates(settings.taxRatesJson) : RATES_2025_26);
	const [showRates, setShowRates] = useState(false);

	// Load users on mount
	useEffect(() => {
		loadUsers();
	}, []);

	// Initialize form state when settings load or user changes
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
				quarterStartMonths: settings.quarterStartMonths,
			});
			setTaxRates(parseTaxRates(settings.taxRatesJson));
		}
	}, [settings]);

	const loadUsers = async () => {
		try {
			const allUsers = await getAllUsers();
			setUsers(allUsers);
			if (allUsers.length > 0 && !selectedUserId) {
				setSelectedUserId(allUsers[0].id);
				await loadUserSettings(allUsers[0].id);
			}
		} catch (err) {
			console.error('Failed to load users:', err);
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
						setSelectedUserId(userId);
						setShowUserPicker(false);
						await loadUserSettings(userId);
					},
					style: 'destructive',
				},
			]);
		} else {
			setSelectedUserId(userId);
			setShowUserPicker(false);
			await loadUserSettings(userId);
		}
	};

	const handleSave = async () => {
		if (!settings) return;

		setIsSaving(true);
		try {
			// Batch all changes into single update call
			const updatePayload: Partial<AppSettingsType> = {};

			// Only include changed fields
			if (formState.defaultVatRate !== settings.defaultVatRate) updatePayload.defaultVatRate = formState.defaultVatRate;
			if (formState.taxScheme !== settings.taxScheme) updatePayload.taxScheme = formState.taxScheme;
			if (formState.applyTaxByDefault !== settings.applyTaxByDefault) updatePayload.applyTaxByDefault = formState.applyTaxByDefault;
			if (formState.defaultPaymentTerms !== settings.defaultPaymentTerms) updatePayload.defaultPaymentTerms = formState.defaultPaymentTerms;
			if (formState.invoicePrefix !== settings.invoicePrefix) updatePayload.invoicePrefix = formState.invoicePrefix;
			if (formState.nextInvoiceNumber !== settings.nextInvoiceNumber) updatePayload.nextInvoiceNumber = formState.nextInvoiceNumber;
			if (formState.estimatePrefix !== settings.estimatePrefix) updatePayload.estimatePrefix = formState.estimatePrefix;
			if (formState.nextEstimateNumber !== settings.nextEstimateNumber) updatePayload.nextEstimateNumber = formState.nextEstimateNumber;
			if (formState.quarterlyTaxEnabled !== settings.quarterlyTaxEnabled) updatePayload.quarterlyTaxEnabled = formState.quarterlyTaxEnabled;
			if (formState.autoCalculateQuarters !== settings.autoCalculateQuarters) updatePayload.autoCalculateQuarters = formState.autoCalculateQuarters;
			if (formState.quarterlyTaxReminderDays !== settings.quarterlyTaxReminderDays) updatePayload.quarterlyTaxReminderDays = formState.quarterlyTaxReminderDays;
			if (formState.reminderEmailEnabled !== settings.reminderEmailEnabled) updatePayload.reminderEmailEnabled = formState.reminderEmailEnabled;
			if (formState.reminderDaysBeforeDue !== settings.reminderDaysBeforeDue) updatePayload.reminderDaysBeforeDue = formState.reminderDaysBeforeDue;
			if (formState.currency !== settings.currency) updatePayload.currency = formState.currency;
			if (formState.dateFormat !== settings.dateFormat) updatePayload.dateFormat = formState.dateFormat;
			if (formState.numberFormat !== settings.numberFormat) updatePayload.numberFormat = formState.numberFormat;
			if (formState.language !== settings.language) updatePayload.language = formState.language;
			if (formState.theme !== settings.theme) updatePayload.theme = formState.theme;
			if (formState.logoUrl !== settings.logoUrl) updatePayload.logoUrl = formState.logoUrl;
			if (formState.defaultNotes !== settings.defaultNotes) updatePayload.defaultNotes = formState.defaultNotes;
			if (formState.financialYearStartMonth !== settings.financialYearStartMonth) updatePayload.financialYearStartMonth = formState.financialYearStartMonth;
			if (formState.financialYearStartDay !== settings.financialYearStartDay) updatePayload.financialYearStartDay = formState.financialYearStartDay;
			if (formState.financialYearEndMonth !== settings.financialYearEndMonth) updatePayload.financialYearEndMonth = formState.financialYearEndMonth;
			if (formState.financialYearEndDay !== settings.financialYearEndDay) updatePayload.financialYearEndDay = formState.financialYearEndDay;
			if (formState.quarterStartMonths !== settings.quarterStartMonths) updatePayload.quarterStartMonths = formState.quarterStartMonths;

			// Always include tax rates
			updatePayload.taxRatesJson = serializeTaxRates(taxRates);

			if (Object.keys(updatePayload).length > 0) {
				await update(updatePayload);
				Alert.alert('Success', 'Settings saved');
			}
		} catch (err) {
			Alert.alert('Error', 'Failed to save settings');
			console.error('Save error:', err);
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
								quarterStartMonths: settings.quarterStartMonths,
							});
							setTaxRates(parseTaxRates(settings.taxRatesJson));
						}
					},
					style: 'destructive',
				},
			]);
		}
	};

	const hasChanges = useMemo(() => {
		if (!settings) return false;
		return (
			formState.defaultVatRate !== settings.defaultVatRate ||
			formState.taxScheme !== settings.taxScheme ||
			formState.applyTaxByDefault !== settings.applyTaxByDefault ||
			formState.defaultPaymentTerms !== settings.defaultPaymentTerms ||
			formState.invoicePrefix !== settings.invoicePrefix ||
			formState.nextInvoiceNumber !== settings.nextInvoiceNumber ||
			formState.estimatePrefix !== settings.estimatePrefix ||
			formState.nextEstimateNumber !== settings.nextEstimateNumber ||
			formState.quarterlyTaxEnabled !== settings.quarterlyTaxEnabled ||
			formState.autoCalculateQuarters !== settings.autoCalculateQuarters ||
			formState.quarterlyTaxReminderDays !== settings.quarterlyTaxReminderDays ||
			formState.reminderEmailEnabled !== settings.reminderEmailEnabled ||
			formState.reminderDaysBeforeDue !== settings.reminderDaysBeforeDue ||
			formState.currency !== settings.currency ||
			formState.dateFormat !== settings.dateFormat ||
			formState.numberFormat !== settings.numberFormat ||
			formState.language !== settings.language ||
			formState.theme !== settings.theme ||
			formState.logoUrl !== settings.logoUrl ||
			formState.defaultNotes !== settings.defaultNotes ||
			formState.financialYearStartMonth !== settings.financialYearStartMonth ||
			formState.financialYearStartDay !== settings.financialYearStartDay ||
			formState.financialYearEndMonth !== settings.financialYearEndMonth ||
			formState.financialYearEndDay !== settings.financialYearEndDay ||
			formState.quarterStartMonths !== settings.quarterStartMonths
		);
	}, [formState, settings]);

	const selectedUser = users.find((u) => u.id === selectedUserId);
	const version = Constants.expoConfig?.version ?? '1.0.0';
	const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? '—';

	// Tax Defaults live preview
	const taxRate = parseFloat(String(formState.defaultVatRate || 0)) || 0;
	const scheme = formState.taxScheme || 'standard';
	const sampleNet = 100;
	const sampleTax = scheme === 'standard' ? sampleNet * (taxRate / 100) : sampleNet - sampleNet / (1 + taxRate / 100);
	const sampleTotal = scheme === 'standard' ? sampleNet + sampleTax : sampleNet;

	// Invoice number preview
	const paddedNum = String(Math.max(1, parseInt(String(formState.nextInvoiceNumber || 1)) || 1)).padStart(3, '0');

	if (loadingUsers || !settings) {
		return (
			<View className='flex-1 items-center justify-center' style={{ backgroundColor: colors.primary }}>
				<ActivityIndicator size='large' color={colors.text} />
			</View>
		);
	}

	return (
		<>
			<ScrollView className='flex-1' style={{ backgroundColor: colors.primary }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
				{/* User Selector */}
				<SectionHeader title='Settings For' />
				<TouchableOpacity
					className='flex-row items-center justify-between py-3 px-4 rounded-lg mb-1'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
					onPress={() => setShowUserPicker(true)}>
					<Text className='text-sm flex-1' style={{ color: colors.text }}>
						{selectedUser?.fullName || 'Select User'}
					</Text>
					<Ionicons name='chevron-down' size={16} color={colors.noActive} />
				</TouchableOpacity>

				{hasChanges && (
					<View className='p-3 rounded-lg mb-3 flex-row items-center gap-2' style={{ backgroundColor: isDark ? 'rgba(255,193,7,0.1)' : 'rgba(255,193,7,0.2)' }}>
						<Ionicons name='alert-circle' size={16} color='#FFC107' />
						<Text className='text-xs flex-1' style={{ color: '#FFC107' }}>
							You have unsaved changes
						</Text>
					</View>
				)}

				{/* Section 1: Tax Defaults */}
				<SectionHeader title='Tax Defaults' />
				<SettingsInputRow
					label='Default tax rate (%)'
					value={String(formState.defaultVatRate ?? 20)}
					onChangeText={(text) => {
						const num = parseFloat(text);
						if (!isNaN(num)) setFormState({ ...formState, defaultVatRate: num });
					}}
					placeholder='20'
					keyboardType='decimal-pad'
				/>
				{/* Tax scheme toggle */}
				<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
					<Text className='text-xs mb-2' style={{ color: colors.noActive }}>
						Tax calculation mode
					</Text>
					<View className='flex-row gap-2'>
						<TouchableOpacity
							className='flex-1 py-2 rounded-lg items-center'
							style={{
								backgroundColor: scheme === 'standard' ? (isDark ? '#4f46e5' : '#4338ca') : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
							}}
							onPress={() => setFormState({ ...formState, taxScheme: 'standard' })}>
							<Text className='text-xs font-bold' style={{ color: scheme === 'standard' ? 'white' : colors.text }}>
								Add on top
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className='flex-1 py-2 rounded-lg items-center'
							style={{
								backgroundColor: scheme === 'inclusive' ? (isDark ? '#4f46e5' : '#4338ca') : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
							}}
							onPress={() => setFormState({ ...formState, taxScheme: 'inclusive' })}>
							<Text className='text-xs font-bold' style={{ color: scheme === 'inclusive' ? 'white' : colors.text }}>
								Inclusive
							</Text>
						</TouchableOpacity>
					</View>
					{/* Live preview */}
					<View className='mt-3 p-3 rounded-lg' style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
						<Text className='text-xs' style={{ color: colors.noActive }}>
							Invoice for {formatGBP(sampleNet)} → Tax {formatGBP(sampleTax)} → Total {formatGBP(sampleTotal)}
						</Text>
					</View>
				</View>
				<SettingsToggleRow
					label='Apply tax by default'
					value={formState.applyTaxByDefault ?? true}
					onToggle={(val) => setFormState({ ...formState, applyTaxByDefault: val })}
				/>
				<SettingsInputRow
					label='Default payment terms (days)'
					value={String(formState.defaultPaymentTerms ?? 30)}
					onChangeText={(text) => {
						const num = parseInt(text);
						if (!isNaN(num)) setFormState({ ...formState, defaultPaymentTerms: num });
					}}
					placeholder='30'
					keyboardType='numeric'
				/>

				{/* Section 2: Invoice & Estimate Numbers */}
				<SectionHeader title='Invoice & Estimate Numbers' />
				<SettingsInputRow
					label='Invoice prefix'
					value={formState.invoicePrefix ?? 'INV'}
					onChangeText={(text) => setFormState({ ...formState, invoicePrefix: text })}
					placeholder='INV'
				/>
				<SettingsInputRow
					label='Next invoice number'
					value={String(formState.nextInvoiceNumber ?? 1)}
					onChangeText={(text) => {
						const num = parseInt(text);
						if (!isNaN(num)) setFormState({ ...formState, nextInvoiceNumber: num });
					}}
					placeholder='1'
					keyboardType='numeric'
				/>
				<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
					<Text className='text-xs' style={{ color: colors.noActive }}>
						Next invoice: {formState.invoicePrefix || 'INV'}-{paddedNum}
					</Text>
				</View>
				<SettingsInputRow
					label='Estimate prefix'
					value={formState.estimatePrefix ?? 'EST'}
					onChangeText={(text) => setFormState({ ...formState, estimatePrefix: text })}
					placeholder='EST'
				/>
				<SettingsInputRow
					label='Next estimate number'
					value={String(formState.nextEstimateNumber ?? 1)}
					onChangeText={(text) => {
						const num = parseInt(text);
						if (!isNaN(num)) setFormState({ ...formState, nextEstimateNumber: num });
					}}
					placeholder='1'
					keyboardType='numeric'
				/>

				{/* Section 3: MTD & Tax */}
				<SectionHeader title='MTD & Tax' />
				<SettingsToggleRow
					label='MTD quarterly updates'
					value={formState.quarterlyTaxEnabled ?? true}
					onToggle={(val) => setFormState({ ...formState, quarterlyTaxEnabled: val })}
				/>
				<SettingsToggleRow
					label='Auto-calculate quarters'
					value={formState.autoCalculateQuarters ?? true}
					onToggle={(val) => setFormState({ ...formState, autoCalculateQuarters: val })}
				/>
				<SettingsInputRow
					label='Quarter start months (comma-separated, e.g. 1,4,7,10)'
					value={formState.quarterStartMonths ?? '1,4,7,10'}
					onChangeText={(text) => setFormState({ ...formState, quarterStartMonths: text })}
					placeholder='1,4,7,10'
				/>
				<SettingsInputRow
					label='Deadline reminder (days)'
					value={String(formState.quarterlyTaxReminderDays ?? 7)}
					onChangeText={(text) => {
						const num = parseInt(text);
						if (!isNaN(num)) setFormState({ ...formState, quarterlyTaxReminderDays: num });
					}}
					placeholder='7'
					keyboardType='numeric'
					maxLength={3}
				/>

				{/* Section 3b: Financial Year */}
				<SectionHeader title='Financial Year' />
				<View className='flex-row gap-2'>
					<View className='flex-1'>
						<SettingsInputRow
							label='Start month'
							value={String(formState.financialYearStartMonth ?? 1)}
							onChangeText={(text) => {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 12) setFormState({ ...formState, financialYearStartMonth: num });
							}}
							placeholder='1'
							keyboardType='numeric'
							maxLength={2}
						/>
					</View>
					<View className='flex-1'>
						<SettingsInputRow
							label='Start day'
							value={String(formState.financialYearStartDay ?? 1)}
							onChangeText={(text) => {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 31) setFormState({ ...formState, financialYearStartDay: num });
							}}
							placeholder='1'
							keyboardType='numeric'
							maxLength={2}
						/>
					</View>
				</View>
				<View className='flex-row gap-2'>
					<View className='flex-1'>
						<SettingsInputRow
							label='End month'
							value={String(formState.financialYearEndMonth ?? 12)}
							onChangeText={(text) => {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 12) setFormState({ ...formState, financialYearEndMonth: num });
							}}
							placeholder='12'
							keyboardType='numeric'
							maxLength={2}
						/>
					</View>
					<View className='flex-1'>
						<SettingsInputRow
							label='End day'
							value={String(formState.financialYearEndDay ?? 31)}
							onChangeText={(text) => {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 31) setFormState({ ...formState, financialYearEndDay: num });
							}}
							placeholder='31'
							keyboardType='numeric'
							maxLength={2}
						/>
					</View>
				</View>

				{/* Section 4: HMRC Tax Rates */}
				<SectionHeader title='HMRC Tax Rates' />
				<TouchableOpacity
					className='py-3 px-4 rounded-lg mb-1 flex-row items-center justify-between'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
					onPress={() => setShowRates(!showRates)}>
					<Text className='text-sm' style={{ color: colors.text }}>
						Income Tax & NI rates
					</Text>
					<Ionicons name={showRates ? 'chevron-up' : 'chevron-down'} size={16} color={colors.noActive} />
				</TouchableOpacity>
				<Text className='text-xs mb-2 px-1' style={{ color: colors.noActive }}>
					Update each April when HMRC publishes new rates. Currently set to 2025-26 defaults.
				</Text>
				{showRates && (
					<View className='gap-1 mb-2'>
						<SettingsInputRow
							label='Personal allowance (£)'
							value={String(taxRates.personalAllowance)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, personalAllowance: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Basic rate threshold (£)'
							value={String(taxRates.basicRateThreshold)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, basicRateThreshold: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Higher rate threshold (£)'
							value={String(taxRates.higherRateThreshold)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, higherRateThreshold: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Basic rate (e.g. 0.20)'
							value={String(taxRates.basicRate)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, basicRate: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Higher rate (e.g. 0.40)'
							value={String(taxRates.higherRate)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, higherRate: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Additional rate (e.g. 0.45)'
							value={String(taxRates.additionalRate)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, additionalRate: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Class 4 NI lower limit (£)'
							value={String(taxRates.ni4LowerProfitsLimit)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, ni4LowerProfitsLimit: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Class 4 NI upper limit (£)'
							value={String(taxRates.ni4UpperProfitsLimit)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, ni4UpperProfitsLimit: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Class 4 NI lower rate (e.g. 0.06)'
							value={String(taxRates.ni4LowerRate)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, ni4LowerRate: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Class 4 NI upper rate (e.g. 0.02)'
							value={String(taxRates.ni4UpperRate)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, ni4UpperRate: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Class 2 NI weekly rate (£)'
							value={String(taxRates.ni2WeeklyRate)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, ni2WeeklyRate: num });
							}}
							keyboardType='decimal-pad'
						/>
						<SettingsInputRow
							label='Class 2 NI threshold (£)'
							value={String(taxRates.ni2SmallEarningsException)}
							onChangeText={(v) => {
								const num = parseFloat(v);
								if (!isNaN(num)) setTaxRates({ ...taxRates, ni2SmallEarningsException: num });
							}}
							keyboardType='decimal-pad'
						/>
						<TouchableOpacity
							className='py-3 px-4 rounded-lg mt-2 items-center'
							style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
							onPress={() => setTaxRates({ ...RATES_2025_26 })}>
							<Text className='text-sm font-bold' style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}>
								Reset to 2025-26 defaults
							</Text>
						</TouchableOpacity>
					</View>
				)}

				{/* Section 5: Appearance */}
				<SectionHeader title='Appearance' />
				<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
					<Text className='text-xs mb-2' style={{ color: colors.noActive }}>
						Theme
					</Text>
					<ThemeToggle size={26} />
				</View>
				<SettingsRow
					label='Currency'
					value={formState.currency ?? 'GBP'}
					onPress={() => {
						const currencies = ['GBP', 'EUR', 'USD', 'PLN'];
						const current = formState.currency ?? 'GBP';
						const idx = currencies.indexOf(current);
						const next = currencies[(idx + 1) % currencies.length];
						setFormState({ ...formState, currency: next });
					}}
				/>

				{/* Section 6: Reminders */}
				<SectionHeader title='Reminders' />
				<SettingsToggleRow
					label='Invoice payment reminders'
					value={formState.reminderEmailEnabled ?? true}
					onToggle={(val) => setFormState({ ...formState, reminderEmailEnabled: val })}
				/>
				<SettingsInputRow
					label='Remind days before due'
					value={String(formState.reminderDaysBeforeDue ?? 3)}
					onChangeText={(text) => {
						const num = parseInt(text);
						if (!isNaN(num)) setFormState({ ...formState, reminderDaysBeforeDue: num });
					}}
					placeholder='3'
					keyboardType='decimal-pad'
					maxLength={3}
				/>

				{/* Section 7: About */}
				<SectionHeader title='About' />
				<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
					<Text className='text-sm' style={{ color: colors.text }}>
						Invoice2Mtd
					</Text>
					<Text className='text-xs mt-1' style={{ color: colors.noActive }}>
						Version {version} (build {buildNumber})
					</Text>
				</View>
				<TouchableOpacity
					className='py-3 px-4 rounded-lg mb-1'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
					onPress={() => Linking.openURL('https://www.gov.uk/government/collections/making-tax-digital-for-income-tax')}>
					<View className='flex-row items-center justify-between'>
						<Text className='text-sm' style={{ color: colors.text }}>
							GOV.UK — Making Tax Digital
						</Text>
						<Ionicons name='open-outline' size={16} color={colors.noActive} />
					</View>
				</TouchableOpacity>
				<TouchableOpacity
					className='py-3 px-4 rounded-lg mb-1'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
					onPress={() => Linking.openURL('https://www.gov.uk/government/collections/self-assessment-detailed-information')}>
					<View className='flex-row items-center justify-between'>
						<Text className='text-sm' style={{ color: colors.text }}>
							GOV.UK — Self Assessment
						</Text>
						<Ionicons name='open-outline' size={16} color={colors.noActive} />
					</View>
				</TouchableOpacity>
				<TouchableOpacity
					className='py-3 px-4 rounded-lg mb-6'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
					onPress={() => Linking.openURL('https://github.com/MarekKabala1/Invoice2Mtd/issues')}>
					<View className='flex-row items-center justify-between'>
						<Text className='text-sm' style={{ color: colors.text }}>
							Report a bug / give feedback
						</Text>
						<Ionicons name='open-outline' size={16} color={colors.noActive} />
					</View>
				</TouchableOpacity>
			</ScrollView>

			{/* User Picker Modal */}
			<Modal visible={showUserPicker} animationType='fade' transparent>
				<View className='flex-1' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<View className='m-4 rounded-lg overflow-hidden' style={{ backgroundColor: colors.card, marginTop: 100 }}>
						<Text className='text-sm font-bold p-4 border-b' style={{ color: colors.text, borderColor: colors.nav }}>
							Select User
						</Text>
						<FlatList
							data={users}
							keyExtractor={(u) => u.id}
							renderItem={({ item }) => (
								<TouchableOpacity onPress={() => handleUserSelect(item.id)} className='py-3 px-4 border-b' style={{ borderColor: colors.nav }}>
									<Text style={{ color: colors.text }}>{item.fullName}</Text>
								</TouchableOpacity>
							)}
						/>
						<TouchableOpacity
							onPress={() => setShowUserPicker(false)}
							className='py-3 px-4 items-center'
							style={{ backgroundColor: isDark ? colors.nav : colors.primary }}>
							<Text style={{ color: colors.text }}>Close</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{/* Save/Cancel Button Bar */}
			<View
				className='flex-row gap-3 px-4 py-3'
				style={{
					backgroundColor: colors.primary,
					borderTopWidth: 1,
					borderTopColor: colors.nav,
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
				}}>
				<TouchableOpacity
					className='flex-1 py-3 rounded-lg items-center'
					style={{
						backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
						opacity: hasChanges ? 1 : 0.5,
					}}
					onPress={handleCancel}
					disabled={!hasChanges}>
					<Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className='flex-1 py-3 rounded-lg items-center'
					style={{
						backgroundColor: isDark ? '#4f46e5' : '#4338ca',
						opacity: hasChanges && !isSaving ? 1 : 0.5,
					}}
					onPress={handleSave}
					disabled={!hasChanges || isSaving}>
					{isSaving ? <ActivityIndicator color='white' size='small' /> : <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>}
				</TouchableOpacity>
			</View>
		</>
	);
}
