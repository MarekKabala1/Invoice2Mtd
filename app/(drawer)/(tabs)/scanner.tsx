import { View, Text } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeToggle from '@/components/ThemeToggle';
import DocumentScanner from '@/components/DocumentScanner';

export default function Scanner() {
	const insets = useSafeAreaInsets();

	return (
		<View style={{ paddingTop: insets.top }} className='flex-1 bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text p-4 w-screen'>
			<View className='w-full items-end'>
				<ThemeToggle size={30} />
			</View>
			<View className=' flex-1 w-full gap-5'>
				<Text className='text-center text-light-text dark:text-dark-text text-xl font-bold'>Document Scanner</Text>
				<DocumentScanner />
			</View>
		</View>
	);
}
