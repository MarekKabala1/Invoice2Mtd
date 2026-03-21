/**
 * info.tsx
 *
 * MTD reference and help screen. Read-only — no forms, no DB calls.
 * Shows tax year info, quarterly deadlines, useful links.
 *
 * Placeholder — full implementation in Phase 1.8 of MASTER_PLAN.md.
 *
 * Depends on: context/ThemeContext
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function InfoScreen() {
  const { colors, isDark } = useTheme();

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
          MTD Info
        </Text>
        <Text
          className="mt-1 text-sm"
          style={{ color: colors.noActive }}
        >
          Making Tax Digital reference — coming soon
        </Text>
      </View>
    </ScrollView>
  );
}
