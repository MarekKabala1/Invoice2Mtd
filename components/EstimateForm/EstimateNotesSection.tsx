import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface EstimateNotesSectionProps {
	note: string;
	setNote: (value: string) => void;
}

export const EstimateNotesSection: React.FC<EstimateNotesSectionProps> = ({
	note,
	setNote,
}) => {
	const { colors } = useTheme();

	return (
		<View className='mb-4'>
			<Text className='text-lg text-light-text dark:text-dark-text font-bold mb-2'>
				Notes
			</Text>
			<TextInput
				className='border text-light-text dark:text-dark-text border-light-text dark:border-dark-text p-4 rounded-md w-full'
				placeholder='Add notes to this estimate...'
				placeholderTextColor={colors.text}
				multiline={true}
				numberOfLines={8}
				value={note}
				onChangeText={setNote}
				textAlignVertical='top'
			/>
		</View>
	);
};
