import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface NotesSectionProps {
	isNotesOpen: boolean;
	setIsNotesOpen: (value: boolean) => void;
	note: string;
	setNote: (value: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ isNotesOpen, setIsNotesOpen, note, setNote }) => {
	const { colors } = useTheme();

	return (
		<View className='mb-4'>
			<Text className='text-lg text-light-text dark:text-dark-text font-bold mb-2'>Notes</Text>
			<TouchableOpacity onPress={() => setIsNotesOpen(!isNotesOpen)} className='flex-row items-center gap-2'>
				<Ionicons name={isNotesOpen ? 'remove-circle-outline' : 'add-circle-outline'} size={18} color={colors.secondary} />
				<Text className='text-light-secondary dark:text-dark-secondary'>Add Notes</Text>
			</TouchableOpacity>

			{isNotesOpen && (
				<TextInput
					className='border text-light-text dark:text-dark-text border-light-text dark:border-dark-text p-4 rounded-md mt-2 w-full'
					placeholder='Add notes to this invoice...'
					placeholderTextColor={colors.text}
					multiline={true}
					numberOfLines={5}
					value={note}
					onChangeText={setNote}
					textAlignVertical='top'
				/>
			)}
		</View>
	);
};
