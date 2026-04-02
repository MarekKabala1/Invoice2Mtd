/**
 * StorageDirectorySection.tsx
 *
 * Settings section for managing per-type storage directories.
 * Allows the user to view, change, and reset the save locations
 * for invoices, estimates, and bills independently.
 *
 * Depends on: utils/shared/permissions.ts
 * Used by: app/(drawer)/settings.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader } from '../components';
import {
	type StorageType,
	getStorageDirectory,
	requestStorageDirectory,
	resetStorageDirectory,
	resetAllStorageDirectories,
} from '@/utils/shared/permissions';

interface StorageTypeConfig {
	type: StorageType;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}

const STORAGE_TYPES: StorageTypeConfig[] = [
	{ type: 'invoice', label: 'Invoices', icon: 'document-text' },
	{ type: 'estimate', label: 'Estimates', icon: 'document' },
	{ type: 'bill', label: 'Bills / Scans', icon: 'scan' },
];

function extractDirectoryName(uri: string | null): string {
	if (!uri) return 'Not set';
	const segments = uri.split('/');
	const last = segments[segments.length - 1];
	return decodeURIComponent(last || uri);
}

export const StorageDirectorySection: React.FC = () => {
	const { colors, isDark } = useTheme();
	const [directories, setDirectories] = useState<Record<StorageType, string | null>>({
		invoice: null,
		estimate: null,
		bill: null,
	});

	const loadDirectories = useCallback(async () => {
		const results: Record<StorageType, string | null> = {
			invoice: null,
			estimate: null,
			bill: null,
		};
		for (const { type } of STORAGE_TYPES) {
			results[type] = await getStorageDirectory(type);
		}
		setDirectories(results);
	}, []);

	useEffect(() => {
		loadDirectories();
	}, [loadDirectories]);

	const handleChangeDirectory = async (type: StorageType, label: string) => {
		const uri = await requestStorageDirectory(type);
		if (uri) {
			setDirectories((prev) => ({ ...prev, [type]: uri }));
			Alert.alert('Success', `${label} save location updated.`);
		}
	};

	const handleResetDirectory = (type: StorageType, label: string) => {
		Alert.alert('Reset directory?', `Clear the ${label} save location? You will be prompted to pick a new one next time you save.`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Reset',
				style: 'destructive',
				onPress: async () => {
					await resetStorageDirectory(type);
					setDirectories((prev) => ({ ...prev, [type]: null }));
				},
			},
		]);
	};

	const handleResetAll = () => {
		Alert.alert('Reset all directories?', 'Clear all save locations? You will be prompted to pick new ones next time you save.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Reset All',
				style: 'destructive',
				onPress: async () => {
					await resetAllStorageDirectories();
					setDirectories({ invoice: null, estimate: null, bill: null });
				},
			},
		]);
	};

	return (
		<>
			<SectionHeader title='Save Locations' />

			{STORAGE_TYPES.map(({ type, label, icon }) => {
				const uri = directories[type];
				return (
					<View key={type} className='rounded-lg mb-1 overflow-hidden' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
						<View className='flex-row items-center py-3 px-4'>
							<Ionicons name={icon} size={18} color={colors.noActive} />
							<Text className='text-sm font-bold ml-2 flex-1' style={{ color: colors.text }}>
								{label}
							</Text>
						</View>
						<View className='px-4 pb-2'>
							<Text className='text-xs mb-2' style={{ color: colors.noActive }} numberOfLines={1}>
								{extractDirectoryName(uri)}
							</Text>
							<View className='flex-row gap-2'>
								<TouchableOpacity
									className='flex-1 py-2 rounded-md items-center'
									style={{ backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(29, 78, 216, 0.1)' }}
									onPress={() => handleChangeDirectory(type, label)}>
									<Text className='text-xs font-bold' style={{ color: colors.text }}>Change</Text>
								</TouchableOpacity>
								<TouchableOpacity
									className='py-2 px-3 rounded-md items-center'
									style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
									onPress={() => handleResetDirectory(type, label)}>
									<Text className='text-xs font-bold' style={{ color: colors.noActive }}>Reset</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				);
			})}

			<TouchableOpacity
				className='py-3 px-4 rounded-lg mt-2 items-center'
				style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
				onPress={handleResetAll}>
				<Text className='text-xs font-bold' style={{ color: colors.noActive }}>
					Reset All Directories
				</Text>
			</TouchableOpacity>
		</>
	);
};
