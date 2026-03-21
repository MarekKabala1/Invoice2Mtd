import React from 'react';
import { View, Text } from 'react-native';

import BaseCard from './BaseCard';

export default function NoSettingsMessage() {
	return (
		<BaseCard className='p-3  mx-3 mt-3 mb-1'>
			<Text className='text-center font-bold text-danger '>No settings found in the database. Please fill in your preferences and save.</Text>
		</BaseCard>
	);
}
