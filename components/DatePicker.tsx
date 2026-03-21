import React, { useState } from 'react';
import { Button, View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, {
	DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface DatePickerProps {
	value: Date | null;
	onChange: (date: Date) => void;
	name: string;
}

export default function DatePicker({ value, onChange, name }: DatePickerProps) {
	const [show, setShow] = useState(false);
	const [iosShow, setIosShow] = useState(true);

	const { colors } = useTheme();

	if (iosShow === false) {
		setTimeout(() => {
			setIosShow(true);
		}, 100);
	}

	const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
		setShow(false);
		setIosShow(false);
		if (selectedDate) {
			onChange(selectedDate);
		}
	};

	const showDatepicker = () => {
		setShow(true);
	};

	return (
		<TouchableOpacity onPress={showDatepicker}>
			<View className='flex-row justify-between'>
				<View className='flex-row justify-start items-center'>
					<Text className='font-bold text-light-text dark:text-dark-text'>
						{name}{' '}
					</Text>
					<Text className='text-light-text dark:text-dark-text underline'>
						{Platform.OS === 'ios' && value ? '' : value?.toLocaleDateString()}
					</Text>
				</View>
				{Platform.OS === 'ios'
					? iosShow && (
							<>
								<Animated.View entering={FadeIn} />
								<DateTimePicker
									testID='dateTimePicker'
									value={value || new Date()}
									mode='date'
									onChange={handleChange}
									display={Platform.OS === 'ios' ? 'compact' : 'default'}
								/>
							</>
						)
					: show && (
							<DateTimePicker
								textColor={colors.text}
								testID='dateTimePicker'
								value={value || new Date()}
								mode='date'
								onChange={handleChange}
							/>
						)}
			</View>
		</TouchableOpacity>
	);
}
