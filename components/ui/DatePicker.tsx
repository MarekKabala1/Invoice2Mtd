import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, {
	DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';

interface DatePickerProps {
	value: Date | null;
	onChange: (date: Date) => void;
	name: string;
}

export default function DatePicker({ value, onChange, name }: DatePickerProps) {
	const [show, setShow] = useState(false);
	const { colors } = useTheme();

	const safeValue = value instanceof Date && !isNaN(value.getTime()) ? value : new Date();

	const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
		setShow(Platform.OS === 'ios');
		if (selectedDate) {
			onChange(selectedDate);
		}
	};

	return (
		<View>
			<TouchableOpacity
				onPress={() => setShow(true)}
				className='flex-row items-center justify-between p-3 rounded-lg'
				style={{
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.noActive,
				}}
			>
				{Boolean(name) && (
					<Text className='font-bold mr-2' style={{ color: colors.text }}>
						{name}
					</Text>
				)}
				<Text style={{ color: colors.text }}>
					{safeValue.toLocaleDateString()}
				</Text>
			</TouchableOpacity>
			{show && (
				<DateTimePicker
					testID='dateTimePicker'
					value={safeValue}
					mode='date'
					onChange={handleChange}
					display={Platform.OS === 'ios' ? 'inline' : 'default'}
				/>
			)}
		</View>
	);
}
