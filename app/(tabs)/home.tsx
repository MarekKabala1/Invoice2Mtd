import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import {
	View,
	Text,
	SafeAreaView,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BaseCard from '@/components/BaseCard';
import Svg, { Circle } from 'react-native-svg';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export const BulletPoints = () => {
	const { colors } = useTheme();
	return (
		<Svg width='12' height='12' viewBox='0 0 12 12'>
			<Circle cx='6' cy='6' r='4' fill={colors.text} />
		</Svg>
	);
};

export default function Home() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();

	return (
		<SafeAreaView
			className='flex-1 bg-light-primary dark:bg-dark-primary  '
			style={{ paddingTop: insets.top }}>
			<View className='flex-1 bg-light-primary dark:bg-dark-primary px-5 gap-4'>
				<View className='w-full justify-end items-end'>
					<ThemeToggle size={35} />
				</View>
				<View className='gap-4 items-center'>
					<Text
						className='text-2xl font-bold text-light-text dark:text-dark-text mb-2 text-center '
						style={{
							display: 'flex',
							letterSpacing: 2,
							textShadowColor: 'black',
							textShadowOffset: { width: 2, height: 1 },
							textShadowRadius: 0,
							color: colors.text,
						}}>
						Invoice & Budget{'\n'} Manager
					</Text>
					<View className='justify-center gap-4'>
						<View className='flex-row items-center  gap-2 '>
							<BulletPoints />
							<Text className='text-sm  text-light-text dark:text-dark-text leading-5'>
								Manage your invoices and track your business finances with ease.
							</Text>
						</View>
						<View className='flex-row items-center gap-2 '>
							<BulletPoints />
							<Text className='text-sm text-light-text dark:text-dark-text leading-5'>
								Track your Budget with ability to add Incomes and Expenses .
							</Text>
						</View>
					</View>
				</View>
				<View className='gap-4'>
					<BaseCard className='p-4'>
						<TouchableOpacity onPress={() => router.push('/userInfo')}>
							<View className='flex-row items-center gap-4'>
								<View className='bg-light-text dark:bg-dark-primary rounded-xl shadow-md p-3'>
									<FontAwesome5 name='user' size={32} color='#f1fcfa' />
								</View>
								<View>
									<Text className='text-lg font-bold text-light-text dark:text-dark-text'>
										Your Information
									</Text>
									<Text className='text-sm text-light-text/80 dark:text-dark-text/80'>
										Manage your personal details
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					</BaseCard>
					<BaseCard className='p-4'>
						<TouchableOpacity onPress={() => router.push('/clientInfo')}>
							<View className='flex-row items-center gap-4'>
								<View className='bg-light-text dark:bg-dark-primary  dark:text-dark-text rounded-xl shadow-md p-3'>
									<FontAwesome5 name='building' size={32} color='#f1fcfa' />
								</View>
								<View>
									<Text className='text-lg font-bold text-light-text dark:text-dark-text'>
										Client Information
									</Text>
									<Text className='text-sm text-light-text/80 dark:text-dark-text/80'>
										Manage client details
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					</BaseCard>
					<BaseCard className='p-4'>
						<TouchableOpacity
							onPress={() => router.push('/termsAndConditions')}>
							<View className='flex-row items-center gap-4'>
								<View className='bg-light-text dark:bg-dark-primary rounded-xl shadow-md p-3'>
									<FontAwesome5
										name='file-contract'
										size={32}
										color='#f1fcfa'
									/>
								</View>
								<View>
									<Text className='text-lg font-bold text-light-text dark:text-dark-text'>
										Terms & Conditions
									</Text>
									<Text className='text-sm text-light-text/80 dark:text-dark-text/80'>
										Manage estimate terms and conditions
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					</BaseCard>
					<BaseCard className='p-4'>
						<TouchableOpacity onPress={() => router.push('/settings')}>
							<View className='flex-row items-center gap-4'>
								<View className='bg-light-text dark:bg-dark-primary rounded-xl shadow-md p-3'>
									<FontAwesome5 name='cog' size={32} color='#f1fcfa' />
								</View>
								<View>
									<Text className='text-lg font-bold text-light-text dark:text-dark-text'>
										Settings
									</Text>
									<Text className='text-sm text-light-text/80 dark:text-dark-text/80'>
										App preferences and financial year
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					</BaseCard>
				</View>

				<View className='mt-auto mb-4'>
					<Text className='text-center text-sm text-light-text/70 dark:text-dark-text/70 dar italic'>
						Tap on any card to get started
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}
