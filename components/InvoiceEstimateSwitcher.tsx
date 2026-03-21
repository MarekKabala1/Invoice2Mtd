import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

type Props = {
	activeTab: 'invoices' | 'estimates';
	setActiveTab: (tab: 'invoices' | 'estimates') => void;
};

export default function InvoiceEstimateSwitcher({
	activeTab,
	setActiveTab,
}: Props) {
	return (
		<View className='flex-row justify-center items-center mt-2 mb-2'>
			<TouchableOpacity
				className={`px-4 py-2 rounded-l-md ${activeTab === 'invoices' ? 'bg-light-nav dark:bg-dark-nav' : 'bg-transparent'}`}
				onPress={() => setActiveTab('invoices')}>
				<Text
					className={`font-bold ${activeTab === 'invoices' ? 'text-light-text dark:text-dark-text' : 'text-gray-400'}`}>
					Invoices
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				className={`px-4 py-2 rounded-r-md ${activeTab === 'estimates' ? 'bg-light-nav dark:bg-dark-nav' : 'bg-transparent'}`}
				onPress={() => setActiveTab('estimates')}>
				<Text
					className={`font-bold ${activeTab === 'estimates' ? 'text-light-text dark:text-dark-text' : 'text-gray-400'}`}>
					Estimates
				</Text>
			</TouchableOpacity>
		</View>
	);
}
