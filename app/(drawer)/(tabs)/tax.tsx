/**
 * tax.tsx
 *
 * Tax tab — the MTD hub screen. Placeholder for now; full implementation
 * comes in Phase 4. Currently shows a simple header so the tab renders
 * without errors after the navigation restructure.
 *
 * Depends on: (none yet — placeholder)
 * Used by: app/(drawer)/(tabs)/_layout.tsx (tab entry)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function TaxScreen() {
  const { colors, isDark } = useTheme();

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.primary }}
    >
      <Text
        className="text-xl font-bold"
        style={{ color: colors.text }}
      >
        Tax
      </Text>
      <Text
        className="mt-2 text-sm"
        style={{ color: colors.noActive }}
      >
        MTD hub — coming soon
      </Text>
    </View>
  );
}
