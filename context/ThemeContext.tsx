import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '@/utils/theme';

type ColorScheme = typeof lightColors;

interface ThemeContextType {
	isDark: boolean;
	colors: ColorScheme;
	toggleTheme: () => void;
	setColorScheme: (scheme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType>({
	isDark: false,
	colors: lightColors,
	toggleTheme: () => {},
	setColorScheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadSavedTheme = async () => {
			try {
				const savedTheme = await AsyncStorage.getItem('theme');
				if (savedTheme) {
					setColorScheme(savedTheme as 'light' | 'dark');
				}
			} catch (error) {
				console.error('Failed to load theme:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadSavedTheme();
	}, []);

	const toggleTheme = async () => {
		try {
			const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
			toggleColorScheme();
			await AsyncStorage.setItem('theme', newScheme);
		} catch (error) {
			console.error('Failed to save theme:', error);
		}
	};

	const theme: ThemeContextType = {
		isDark: colorScheme === 'dark',
		colors: colorScheme === 'dark' ? darkColors : lightColors,
		toggleTheme,
		setColorScheme: async (scheme) => {
			setColorScheme(scheme);
			await AsyncStorage.setItem('theme', scheme);
		},
	};

	if (isLoading) return null;

	return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
