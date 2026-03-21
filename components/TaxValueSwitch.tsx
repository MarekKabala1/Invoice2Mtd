import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { color } from '@/utils/theme';

interface TaxValueSwitchProps {
	isEnabled: boolean;
	onToggle: () => void;
	label?: string;
	trackColor?: {
		false: string;
		true: string;
	};
	thumbColor?: {
		false: string;
		true: string;
	};
	falseText?: string;
	trueText?: string;
}

const TaxValueSwitch: React.FC<TaxValueSwitchProps> = ({ isEnabled, onToggle, label = 'Tax Calculation', trackColor, thumbColor, falseText, trueText }) => {
	const { isDark } = useTheme();

	const defaultTrackColor = isDark
		? {
				false: color.dark.track.false,
				true: color.dark.track.true,
			}
		: {
				false: color.light.track.false,
				true: color.light.track.true,
			};

	const defaultThumbColor = {
		false: isDark ? color.dark.thumb.false : color.light.thumb.false,
		true: isDark ? color.dark.thumb.true : color.light.thumb.true,
	};

	return (
		<View className='flex-row items-center justify-between py-2'>
			<View className='flex-row items-center'>
				<Text className='text-light-text dark:text-dark-text mr-2'>{label}</Text>
				<Text className='text-xs text-light-text dark:text-dark-text opacity-50'>{isEnabled ? trueText : falseText}</Text>
			</View>
			<Switch
				value={isEnabled}
				onValueChange={onToggle}
				trackColor={trackColor || defaultTrackColor}
				thumbColor={isEnabled ? thumbColor?.true || defaultThumbColor.true : thumbColor?.false || defaultThumbColor.false}
			/>
		</View>
	);
};

export default TaxValueSwitch;
