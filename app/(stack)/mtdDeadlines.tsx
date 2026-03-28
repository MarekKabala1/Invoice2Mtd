/**
 * mtdDeadlines.tsx
 *
 * Deadline tracker screen. Shows all MTD quarterly deadlines and the final
 * declaration deadline, grouped by urgency. Cards are tappable — clicking
 * a quarter deadline navigates to mtdQuarterlySummary with that quarter
 * pre-selected. Final declaration shows the annual estimate.
 *
 * Depends on: hooks/useMtdDeadlines.ts, utils/mtdCategories.ts
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile)
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useMtdDeadlines } from '@/hooks/mtd/useMtdDeadlines';
import { Ionicons } from '@expo/vector-icons';
import { DeadlineItem } from '@/types/mtd';

const statusColor: Record<string, string> = {
  overdue: '#ee1c1c',
  urgent: '#f59e0b',
  soon: '#f59e0b',
  ok: '#39AD6A',
};

const statusBg: Record<string, string> = {
  overdue: 'rgba(238,28,28,0.1)',
  urgent: 'rgba(245,158,11,0.1)',
  soon: 'rgba(245,158,11,0.05)',
  ok: 'rgba(57,173,106,0.1)',
};

const statusLabel: Record<string, string> = {
  overdue: 'Overdue — submit immediately',
  urgent: 'Due soon — act now',
  soon: 'Approaching — prepare your records',
  ok: 'On track',
};

function DeadlineCard({
  item,
  isDark,
  onPress,
}: {
  item: DeadlineItem;
  isDark: boolean;
  onPress: () => void;
}) {
  const color = statusColor[item.status] ?? '#64748b';
  const bg = statusBg[item.status] ?? 'rgba(100,116,139,0.1)';
  const label = statusLabel[item.status] ?? '';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-lg p-4 mb-3 border-l-4"
      style={{
        borderLeftColor: color,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-bold text-base" style={{ color: isDark ? '#F3EDE2' : '#1a1a2e' }}>
            {item.label}
          </Text>
          <Text className="text-sm mt-1" style={{ color: isDark ? '#93c5fd' : '#64748b' }}>
            {item.deadlineFormatted}
          </Text>
        </View>
        <View className="items-end">
          <View
            className="px-3 py-1 rounded-full mb-1"
            style={{ backgroundColor: bg }}
          >
            <Text className="text-xs font-bold" style={{ color }}>
              {item.daysUntil < 0
                ? `${Math.abs(item.daysUntil)}d overdue`
                : item.daysUntil === 0
                  ? 'Today'
                  : `${item.daysUntil}d`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
        </View>
      </View>
      <View className="mt-2">
        <Text className="text-xs" style={{ color }}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3 mt-4">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
        {title}
      </Text>
    </View>
  );
}

export default function MtdDeadlinesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { deadlines, overdue, thisQuarter, endOfYear, upcoming } = useMtdDeadlines(2);

  const handlePress = (item: DeadlineItem) => {
    if (item.type === 'quarterly' && item.quarter) {
      // Navigate to quarterly summary with quarter AND taxYear
      // so it shows data for the correct year, not always the current year
      router.push({
        pathname: '/(stack)/mtdQuarterlySummary',
        params: { quarter: item.quarter.toString(), taxYear: item.taxYear },
      });
    } else if (item.type === 'final_declaration') {
      // Navigate to annual estimate
      router.push('/(stack)/mtdAnnualEstimate');
    }
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {deadlines.length === 0 ? (
        <View className="items-center py-12">
          <Ionicons name="calendar-outline" size={64} color={colors.noActive} />
          <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>
            No upcoming deadlines
          </Text>
          <Text className="text-sm mt-2 text-center" style={{ color: colors.noActive }}>
            Deadlines will appear here as tax quarters approach.
          </Text>
        </View>
      ) : (
        <>
          {/* Overdue */}
          {overdue.length > 0 && (
            <View>
              <SectionHeader title="Overdue" color="#ee1c1c" />
              {overdue.map((item) => (
                <DeadlineCard
                  key={`${item.type}-${item.deadline}`}
                  item={item}
                  isDark={isDark}
                  onPress={() => handlePress(item)}
                />
              ))}
            </View>
          )}

          {/* This quarter */}
          {thisQuarter.length > 0 && (
            <View>
              <SectionHeader title="This Quarter" color="#f59e0b" />
              {thisQuarter.map((item) => (
                <DeadlineCard
                  key={`${item.type}-${item.deadline}`}
                  item={item}
                  isDark={isDark}
                  onPress={() => handlePress(item)}
                />
              ))}
            </View>
          )}

          {/* End of year — final declaration */}
          {endOfYear.length > 0 && (
            <View>
              <SectionHeader title="End of Year Declaration" color={isDark ? '#93c5fd' : '#1d4ed8'} />
              {endOfYear.map((item) => (
                <DeadlineCard
                  key={`${item.type}-${item.deadline}`}
                  item={item}
                  isDark={isDark}
                  onPress={() => handlePress(item)}
                />
              ))}
            </View>
          )}

          {/* Upcoming — future quarters only */}
          {upcoming.length > 0 && (
            <View>
              <SectionHeader title="Upcoming" color={isDark ? '#93c5fd' : '#2563eb'} />
              {upcoming.map((item) => (
                <DeadlineCard
                  key={`${item.type}-${item.deadline}`}
                  item={item}
                  isDark={isDark}
                  onPress={() => handlePress(item)}
                />
              ))}
            </View>
          )}
        </>
      )}

      {/* GOV.UK link */}
      <TouchableOpacity
        className="mt-6 p-4 rounded-lg items-center"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        onPress={() =>
          Linking.openURL(
            'https://www.gov.uk/government/collections/making-tax-digital-for-income-tax'
          )
        }
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="open-outline" size={18} color={colors.text} />
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            GOV.UK — Making Tax Digital
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
