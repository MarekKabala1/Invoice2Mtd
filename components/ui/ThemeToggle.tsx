import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
	size: number;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ size }) => {
	const { isDark, toggleTheme, setColorScheme, colors } = useTheme();

	useEffect(() => {
		isDark ? setColorScheme('dark') : setColorScheme('light');
	}, [isDark]);

	return (
		<TouchableOpacity onPress={toggleTheme} className='p-2 rounded-full bg-light-primary dark:bg-dark-primary'>
			<MaterialCommunityIcons
				name={isDark ? 'weather-night' : 'weather-sunny'}
				color={colors.text}
				size={size}
				className='text-light-text dark:text-dark-text'
			/>
		</TouchableOpacity>
	);
};

export default ThemeToggle;
