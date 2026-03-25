/**
 * AboutSection.tsx
 *
 * About and related links section.
 * Shows version info and links to external documentation.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader } from '../components';

export const AboutSection: React.FC = () => {
	const { colors, isDark } = useTheme();

	const version = Constants.expoConfig?.version || '1.0.0';
	const buildNumber = Constants.expoConfig?.ios?.buildNumber || 'unknown';

	return (
		<>
			<SectionHeader title="About" />

			<View
				className="py-3 px-4 rounded-lg mb-1"
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}
			>
				<Text className="text-sm" style={{ color: colors.text }}>
					Invoice2Mtd
				</Text>
				<Text className="text-xs mt-1" style={{ color: colors.noActive }}>
					Version {version} (build {buildNumber})
				</Text>
			</View>

			<TouchableOpacity
				className="py-3 px-4 rounded-lg mb-1"
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				onPress={() =>
					Linking.openURL(
						'https://www.gov.uk/government/collections/making-tax-digital-for-income-tax'
					)
				}
			>
				<View className="flex-row items-center justify-between">
					<Text className="text-sm" style={{ color: colors.text }}>
						GOV.UK — Making Tax Digital
					</Text>
					<Ionicons name="open-outline" size={16} color={colors.noActive} />
				</View>
			</TouchableOpacity>

			<TouchableOpacity
				className="py-3 px-4 rounded-lg mb-6"
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				onPress={() => Linking.openURL('https://www.hmrc.gov.uk')}
			>
				<View className="flex-row items-center justify-between">
					<Text className="text-sm" style={{ color: colors.text }}>
						HMRC.GOV.UK
					</Text>
					<Ionicons name="open-outline" size={16} color={colors.noActive} />
				</View>
			</TouchableOpacity>
		</>
	);
};
