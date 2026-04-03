/**
 * CloudSyncSection.tsx
 *
 * Cloud sync settings section for Supabase integration.
 * Shows sync status, pending count, and sync button.
 *
 * Used by: app/(drawer)/settings.tsx
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useCloudSync } from '@/hooks/useCloudSync';
import { SectionHeader } from '../components';
import { format } from 'date-fns';

export const CloudSyncSection: React.FC = () => {
	const { colors, isDark } = useTheme();
	const [expanded, setExpanded] = useState(false);
	const {
		sync,
		isSyncing,
		lastSyncTime,
		pendingCount,
		isConnected,
		progress,
	} = useCloudSync();

	const formatLastSync = () => {
		if (!lastSyncTime) return 'Never';
		try {
			return format(new Date(lastSyncTime), 'dd MMM yyyy, HH:mm');
		} catch {
			return 'Unknown';
		}
	};

	return (
		<>
			<SectionHeader title='Cloud Sync' />

			<TouchableOpacity
				className='py-3 px-4 rounded-lg mb-1'
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				onPress={() => setExpanded(!expanded)}>
				<View className='flex-row items-center justify-between'>
					<View className='flex-row items-center gap-3'>
						<View
							className='w-10 h-10 rounded-full items-center justify-center'
							style={{ backgroundColor: colors.accent }}>
							<Ionicons name='cloud-outline' size={20} color='white' />
						</View>
						<View>
							<Text className='font-semibold' style={{ color: colors.text }}>
								Cloud Sync
							</Text>
							<Text className='text-xs' style={{ color: colors.noActive }}>
								{pendingCount > 0
									? `${pendingCount} items pending`
									: 'All synced'}
							</Text>
						</View>
					</View>
					<View className='flex-row items-center gap-2'>
						<View
							className={`w-2 h-2 rounded-full ${
								isConnected ? 'bg-green-500' : 'bg-red-500'
							}`}
						/>
						<Ionicons
							name={expanded ? 'chevron-up' : 'chevron-down'}
							size={20}
							color={colors.noActive}
						/>
					</View>
				</View>
			</TouchableOpacity>

			{expanded && (
				<View
					className='py-3 px-4 rounded-lg mb-1'
					style={{
						backgroundColor: isDark ? colors.nav : colors.card,
						borderTopWidth: 1,
						borderTopColor: colors.border,
					}}>
					<View className='gap-3'>
						<View className='flex-row justify-between'>
							<Text style={{ color: colors.noActive }}>Status</Text>
							<Text
								className={isConnected ? 'text-green-500' : 'text-red-500'}>
								{isConnected ? 'Connected' : 'Offline'}
							</Text>
						</View>

						<View className='flex-row justify-between'>
							<Text style={{ color: colors.noActive }}>Last Sync</Text>
							<Text style={{ color: colors.text }}>{formatLastSync()}</Text>
						</View>

						<View className='flex-row justify-between'>
							<Text style={{ color: colors.noActive }}>Pending Items</Text>
							<Text
								className={pendingCount > 0 ? 'text-orange-500' : 'text-green-500'}>
								{pendingCount}
							</Text>
						</View>

						{progress && (
							<View className='mt-2'>
								<Text style={{ color: colors.noActive, marginBottom: 4 }}>
									Syncing {progress.currentTable}...
								</Text>
								<View
									className='h-2 rounded-full overflow-hidden'
									style={{ backgroundColor: colors.border }}>
									<View
										className='h-full bg-mtd-accent-600'
										style={{
											width: `${(progress.current / progress.total) * 100}%`,
										}}
									/>
								</View>
							</View>
						)}

						<TouchableOpacity
							onPress={sync}
							disabled={isSyncing}
							className='mt-2 p-3 rounded-lg items-center'
							style={{
								backgroundColor: isSyncing ? colors.border : colors.accent,
							}}>
							{isSyncing ? (
								<ActivityIndicator color='white' size='small' />
							) : (
								<Text className='text-white font-medium'>
									{pendingCount > 0 ? `Sync ${pendingCount} Items` : 'Sync Now'}
								</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			)}
		</>
	);
};
