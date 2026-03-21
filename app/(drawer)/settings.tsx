/**
 * settings.tsx
 *
 * Settings screen accessible from the drawer. Consolidates all app
 * configuration: Profile, Bank Details, Tax Defaults, Invoice Numbers,
 * MTD & Tax, Appearance, Reminders, About.
 *
 * Placeholder — full implementation in Phase 1.7 of MASTER_PLAN.md.
 *
 * Depends on: context/AppSettingsContext, context/ThemeContext
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { settings } = useAppSettings();

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
    >
      <View className="px-5 py-6">
        <Text
          className="text-2xl font-bold"
          style={{ color: colors.text }}
        >
          Settings
        </Text>
        <Text
          className="mt-1 text-sm"
          style={{ color: colors.noActive }}
        >
          Full settings screen — coming soon
        </Text>
      </View>
    </ScrollView>
  );
}
