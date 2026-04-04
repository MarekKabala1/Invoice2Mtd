/**
 * CloudSyncSection.tsx
 *
 * Cloud sync settings section for Supabase integration.
 * Shows auth status, sync status, pending count, and sync button.
 *
 * Used by: app/(drawer)/settings.tsx
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/context/AppSettingsContext';
import { SectionHeader } from '../components';
import { format } from 'date-fns';
import { queueAllForSync } from '@/db/supabase/sync/syncEngine';
import { signUp } from '@/db/supabase/supabase';
import { runMigrations } from '@/db/runMigrations';
import { clearQueue } from '@/db/supabase/sync/syncQueue';

type AuthMode = 'signin' | 'signup';

export const CloudSyncSection: React.FC = () => {
	const { colors, isDark } = useTheme();
	const { selectedUserId } = useAppSettings();
	const [expanded, setExpanded] = useState(true);
	const [showAuth, setShowAuth] = useState(false);
	const [authMode, setAuthMode] = useState<AuthMode>('signin');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isQueueing, setIsQueueing] = useState(false);
	
	const {
		sync,
		isSyncing,
		lastSyncTime,
		pendingCount,
		isConnected,
		isAuthenticated,
		progress,
		refreshStatus,
	} = useCloudSync();
	
	const { isSignedIn, user, signIn, signOut, linkUserToAuth } = useAuth();

	const formatLastSync = () => {
		if (!lastSyncTime) return 'Never';
		try {
			return format(new Date(lastSyncTime), 'dd MMM yyyy, HH:mm');
		} catch {
			return 'Unknown';
		}
	};

	const handleAuth = async () => {
		setError('');
		
		if (!email || !password) {
			setError('Please enter email and password');
			return;
		}
		
		if (authMode === 'signup') {
			if (password !== confirmPassword) {
				setError('Passwords do not match');
				return;
			}
			if (password.length < 6) {
				setError('Password must be at least 6 characters');
				return;
			}
		}
		
		setIsLoading(true);
		
		if (authMode === 'signin') {
			const { error: authError } = await signIn(email, password);
			if (authError) {
				setError(authError.message);
			} else {
				// Link local user to Supabase auth user
				if (selectedUserId) {
					await linkUserToAuth(selectedUserId);
				}
				setShowAuth(false);
				clearForm();
			}
		} else {
			const { error: signUpError } = await signUp(email, password);
			if (signUpError) {
				setError(signUpError.message);
			} else {
				Alert.alert(
					'Account Created',
					'Please check your email to confirm your account, then sign in.'
				);
				setAuthMode('signin');
				clearForm();
			}
		}
		
		setIsLoading(false);
	};

	const clearForm = () => {
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setError('');
	};

	const handleSignOut = async () => {
		await signOut();
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
								{isSignedIn 
									? (pendingCount > 0 ? `${pendingCount} items pending` : 'All synced')
									: 'Sign in required'}
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
						{/* Auth Status */}
						<View className='flex-row justify-between'>
							<Text style={{ color: colors.noActive }}>Account</Text>
							{isSignedIn ? (
								<View className='flex-row items-center gap-2'>
									<Text style={{ color: colors.text }}>{user?.email}</Text>
									<TouchableOpacity onPress={handleSignOut}>
										<Text className='text-red-500'>Sign out</Text>
									</TouchableOpacity>
								</View>
							) : (
								<TouchableOpacity onPress={() => setShowAuth(!showAuth)}>
									<Text className='text-blue-500'>Sign in</Text>
								</TouchableOpacity>
							)}
						</View>

						{/* Auth Form */}
						{showAuth && !isSignedIn && (
							<View className='gap-2 mt-2'>
								{/* Toggle Sign In / Sign Up */}
								<View className='flex-row rounded overflow-hidden border' style={{ borderColor: colors.border }}>
									<TouchableOpacity
										onPress={() => { setAuthMode('signin'); clearForm(); }}
										className={`flex-1 p-2 ${authMode === 'signin' ? 'bg-blue-500' : 'bg-transparent'}`}>
										<Text className={`text-center ${authMode === 'signin' ? 'text-white' : 'text-gray-500'}`}>Sign In</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => { setAuthMode('signup'); clearForm(); }}
										className={`flex-1 p-2 ${authMode === 'signup' ? 'bg-blue-500' : 'bg-transparent'}`}>
										<Text className={`text-center ${authMode === 'signup' ? 'text-white' : 'text-gray-500'}`}>Sign Up</Text>
									</TouchableOpacity>
								</View>

								<TextInput
									className='p-3 rounded border'
									style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
									placeholder='Email'
									value={email}
									onChangeText={setEmail}
									autoCapitalize='none'
									keyboardType='email-address'
									autoCorrect={false}
								/>
								<TextInput
									className='p-3 rounded border'
									style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
									placeholder='Password'
									value={password}
									onChangeText={setPassword}
									secureTextEntry
								/>
								
								{authMode === 'signup' && (
									<TextInput
										className='p-3 rounded border'
										style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
										placeholder='Confirm Password'
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										secureTextEntry
									/>
								)}
								
								{error ? (
									<Text className='text-red-500 text-sm'>{error}</Text>
								) : null}
								
								<TouchableOpacity
									onPress={handleAuth}
									disabled={isLoading}
									className='p-3 rounded items-center'
									style={{ backgroundColor: colors.accent }}>
									{isLoading ? (
										<ActivityIndicator color='white' size='small' />
									) : (
										<Text className='text-white font-medium'>
											{authMode === 'signin' ? 'Sign In' : 'Create Account'}
										</Text>
									)}
								</TouchableOpacity>
							</View>
						)}

						{/* Status */}
						<View className='flex-row justify-between'>
							<Text style={{ color: colors.noActive }}>Status</Text>
							<Text className={isConnected ? 'text-green-500' : 'text-red-500'}>
								{isConnected ? 'Connected' : 'Offline'}
							</Text>
						</View>

						<View className='flex-row justify-between'>
							<Text style={{ color: colors.noActive }}>Last Sync</Text>
							<Text style={{ color: colors.text }}>{formatLastSync()}</Text>
						</View>

						<View className='flex-row justify-between'>
							<Text style={{ color: colors.noActive }}>Pending Items</Text>
							<Text className={pendingCount > 0 ? 'text-orange-500' : 'text-green-500'}>
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

						{/* Sync Buttons */}
						{isSignedIn && (
							<>
								{/* Queue All Data Button */}
								<View className='flex-row gap-2 mt-2'>
									<TouchableOpacity
										onPress={async () => {
											if (!selectedUserId) {
												Alert.alert('Error', 'Please select a user first');
												return;
											}
											setIsQueueing(true);
											try {
												await runMigrations();
												const count = await queueAllForSync(selectedUserId);
												await refreshStatus();
												Alert.alert('Queued', `${count} new items queued`);
											} catch (error) {
												Alert.alert('Error', error instanceof Error ? error.message : 'Failed to queue data');
											} finally {
												setIsQueueing(false);
											}
										}}
										disabled={isQueueing}
										className='flex-1 p-3 rounded-lg items-center'
										style={{
											backgroundColor: isQueueing ? colors.border : 'rgba(34, 197, 94, 0.8)',
										}}>
										{isQueueing ? (
											<ActivityIndicator color='white' size='small' />
										) : (
											<Text className='text-white font-medium'>Queue Data</Text>
										)}
									</TouchableOpacity>

									<TouchableOpacity
										onPress={async () => {
											Alert.alert(
												'Clear Queue',
												'This will clear all pending sync items. Continue?',
												[
													{ text: 'Cancel', style: 'cancel' },
													{
														text: 'Clear',
														style: 'destructive',
														onPress: async () => {
															await clearQueue();
															await refreshStatus();
														},
													},
												]
											);
										}}
										className='p-3 rounded-lg items-center'
										style={{
											backgroundColor: colors.danger,
										}}>
										<Text className='text-white font-medium'>Clear</Text>
									</TouchableOpacity>
								</View>

								{/* Sync Now Button */}
								<TouchableOpacity
									onPress={sync}
									disabled={isSyncing || pendingCount === 0}
									className='mt-2 p-3 rounded-lg items-center'
									style={{
										backgroundColor: isSyncing || pendingCount === 0 ? colors.border : colors.accent,
									}}>
									{isSyncing ? (
										<ActivityIndicator color='white' size='small' />
									) : (
										<Text className='text-white font-medium'>
											{pendingCount > 0 ? `Sync ${pendingCount} Items` : 'All Synced'}
										</Text>
									)}
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>
			)}
		</>
	);
};
