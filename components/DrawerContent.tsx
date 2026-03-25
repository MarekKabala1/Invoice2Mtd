/**
 * DrawerContent.tsx
 *
 * Custom drawer content component. Renders app name, user info,
 * navigation items, theme toggle, and app version.
 * Integrates all features from the old app into the drawer.
 *
 * Depends on: context/ThemeContext, utils/theme, expo-constants,
 *             @react-navigation/drawer
 * Used by: app/(drawer)/_layout.tsx (drawerContent prop)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { db } from '@/db/config';
import { User } from '@/db/schema';

interface DrawerItem {
	label: string;
	route: string;
	icon: string;
	section: 'main' | 'tools' | 'account';
}

const DRAWER_ITEMS: DrawerItem[] = [
	// Main navigation
	{ label: 'Home', route: '/(drawer)/(tabs)/home', icon: 'home-outline', section: 'main' },
	{ label: 'Invoices', route: '/(drawer)/(tabs)/invoices', icon: 'document-text-outline', section: 'main' },
	{ label: 'Tax (MTD)', route: '/(drawer)/(tabs)/tax', icon: 'calculator-outline', section: 'main' },
	{ label: 'Budget', route: '/(drawer)/(tabs)/budget', icon: 'wallet-outline', section: 'main' },
	{ label: 'Scanner', route: '/(drawer)/(tabs)/scanner', icon: 'scan-outline', section: 'main' },
	// Tools
	{ label: 'Charts & Analytics', route: '/(drawer)/charts', icon: 'bar-chart-outline', section: 'tools' },
	{ label: 'Client Information', route: '/(stack)/clientInfo', icon: 'business-outline', section: 'tools' },
	{ label: 'Terms & Conditions', route: '/(stack)/termsAndConditions', icon: 'document-outline', section: 'tools' },
	// Account
	{ label: 'Your Information', route: '/(stack)/(user)/userInfo', icon: 'person-outline', section: 'account' },
	{ label: 'Settings', route: '/(drawer)/settings', icon: 'settings-outline', section: 'account' },
	{ label: 'MTD Info', route: '/(drawer)/info', icon: 'information-circle-outline', section: 'account' },
];

function SectionLabel({ title, isDark }: { title: string; isDark: boolean }) {
	return (
		<Text className='text-xs font-bold uppercase tracking-widest px-3 pt-5 pb-2' style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }}>
			{title}
		</Text>
	);
}

export default function DrawerContent(props: DrawerContentComponentProps) {
	const { colors, isDark } = useTheme();
	const pathname = usePathname();
	const version = Constants.expoConfig?.version ?? '1.0.0';
	const [userName, setUserName] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState<string | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const users = await db.select().from(User).limit(1);
				if (users.length > 0) {
					setUserName(users[0].fullName ?? null);
					setUserEmail(users[0].emailAddress ?? null);
				}
			} catch {
				// Silent fail — user info is non-critical
			}
		};
		fetchUser();
	}, []);

	const isActive = (route: string): boolean => {
		// Extract the screen name from the route
		const parts = route.split('/');
		const screenName = parts[parts.length - 1];
		return pathname.includes(screenName);
	};

	const renderItem = (item: DrawerItem) => {
		const focused = isActive(item.route);
		return (
			<TouchableOpacity
				key={item.label}
				className='flex-row items-center rounded-lg px-3 py-2.5'
				style={{
					backgroundColor: focused ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
				}}
				onPress={() => {
					props.navigation.closeDrawer();
					router.push(item.route as unknown as Parameters<typeof router.push>[0]);
				}}>
				<Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={focused ? colors.text : colors.noActive} />
				<Text
					className='ml-3 text-sm'
					style={{
						color: focused ? colors.text : colors.noActive,
						fontWeight: focused ? 'bold' : 'normal',
					}}>
					{item.label}
				</Text>
			</TouchableOpacity>
		);
	};

	const mainItems = DRAWER_ITEMS.filter((i) => i.section === 'main');
	const toolItems = DRAWER_ITEMS.filter((i) => i.section === 'tools');
	const accountItems = DRAWER_ITEMS.filter((i) => i.section === 'account');

	return (
		<View className='flex-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
			<ScrollView contentContainerStyle={{ paddingTop: 0, flexGrow: 1 }} style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				{/* Header */}
				<View className='px-5 pb-4 pt-8' style={{ backgroundColor: isDark ? colors.primary : colors.text }}>
					<Text className='text-lg font-bold text-white'>Invoice2Mtd</Text>
					<Text className='mt-1 text-xs text-white opacity-70'>Invoicing &amp; Making Tax Digital</Text>
					{userName && (
						<View className='mt-3 flex-row items-center gap-2'>
							<Ionicons name='person-circle-outline' size={20} color='rgba(255,255,255,0.7)' />
							<View>
								<Text className='text-sm text-white font-bold'>{userName}</Text>
								{userEmail && <Text className='text-xs text-white opacity-60'>{userEmail}</Text>}
							</View>
						</View>
					)}
				</View>

				{/* Main navigation */}
				<View className='mt-4 px-3'>{mainItems.map(renderItem)}</View>

				{/* Tools section */}
				<View className='px-3'>
					<SectionLabel title='Tools' isDark={isDark} />
					{toolItems.map(renderItem)}
				</View>

				{/* Account section */}
				<View className='px-3'>
					<SectionLabel title='Account' isDark={isDark} />
					{accountItems.map(renderItem)}
				</View>
			</ScrollView>

			{/* Footer */}
			<View className='border-t px-5 py-4' style={{ borderColor: colors.border }}>
				<View className='flex-row items-center justify-between'>
					<ThemeToggle size={24} />
					<Text className='text-xs' style={{ color: colors.noActive }}>
						v{version}
					</Text>
				</View>
			</View>
		</View>
	);
}
