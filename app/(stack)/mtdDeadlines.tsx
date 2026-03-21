/**
 * mtdDeadlines.tsx
 *
 * Deadline tracker screen. Shows all MTD quarterly deadlines and the final
 * declaration deadline, grouped by urgency status. Pure read-only — uses
 * useMtdDeadlines hook which does no DB calls.
 *
 * Depends on: hooks/useMtdDeadlines.ts, utils/mtdCategories.ts (status maps)
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile)
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMtdDeadlines } from '@/hooks/useMtdDeadlines';
import {
  STATUS_DEADLINE_COLOR,
  STATUS_DEADLINE_BADGE_BG,
  STATUS_DEADLINE_BORDER,
  STATUS_DEADLINE_LABEL,
} from '@/utils/mtdCategories';
import { DeadlineItem } from '@/types/mtd';

function DeadlineCard({ item, isDark }: { item: DeadlineItem; isDark: boolean }) {
  const borderClass = STATUS_DEADLINE_BORDER[item.status];
  const badgeBgClass = STATUS_DEADLINE_BADGE_BG[item.status];
  const colorClass = STATUS_DEADLINE_COLOR[item.status];
  const label = STATUS_DEADLINE_LABEL[item.status];

  return (
    <View
      className={`rounded-lg p-4 mb-3 border-l-4 ${borderClass}`}
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-bold text-base" style={{ color: isDark ? '#F3EDE2' : '#8B5E3C' }}>
            {item.label}
          </Text>
          <Text className="text-sm mt-1" style={{ color: isDark ? '#a5b4fc' : '#64748b' }}>
            {item.deadlineFormatted}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${badgeBgClass}`}>
          <Text className={`text-xs font-bold ${colorClass}`}>
            {item.daysUntil < 0
              ? `${Math.abs(item.daysUntil)}d overdue`
              : item.daysUntil === 0
                ? 'Today'
                : `${item.daysUntil}d`}
          </Text>
        </View>
      </View>
      <View className="mt-2">
        <Text className={`text-xs ${colorClass}`}>{label}</Text>
      </View>
    </View>
  );
}

export default function MtdDeadlinesScreen() {
  const { colors, isDark } = useTheme();
  const { deadlines, overdue, urgent, upcoming } = useMtdDeadlines(2);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      contentContainerStyle={{ padding: 20 }}
    >
      {deadlines.length === 0 ? (
        <View className="items-center py-12">
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            No upcoming deadlines
          </Text>
          <Text className="text-sm mt-2" style={{ color: colors.noActive }}>
            Deadlines will appear here as tax quarters approach.
          </Text>
        </View>
      ) : (
        <>
          {/* Overdue */}
          {overdue.length > 0 && (
            <View className="mb-6">
              <Text
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: '#ee1c1c' }}
              >
                Overdue
              </Text>
              {overdue.map((item) => (
                <DeadlineCard
                  key={`${item.type}-${item.deadline}`}
                  item={item}
                  isDark={isDark}
                />
              ))}
            </View>
          )}

          {/* Due within 14 days */}
          {urgent.length > 0 && (
            <View className="mb-6">
              <Text
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: '#f59e0b' }}
              >
                Due within 14 days
              </Text>
              {urgent.map((item) => (
                <DeadlineCard
                  key={`${item.type}-${item.deadline}`}
                  item={item}
                  isDark={isDark}
                />
              ))}
            </View>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <View className="mb-6">
              <Text
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: colors.noActive }}
              >
                Upcoming
              </Text>
              {upcoming.map((item) => (
                <DeadlineCard
                  key={`${item.type}-${item.deadline}`}
                  item={item}
                  isDark={isDark}
                />
              ))}
            </View>
          )}
        </>
      )}

      {/* GOV.UK link */}
      <TouchableOpacity
        className="mt-4 p-4 rounded-lg items-center"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        onPress={() =>
          Linking.openURL(
            'https://www.gov.uk/government/collections/making-tax-digital-for-income-tax'
          )
        }
      >
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          GOV.UK — Making Tax Digital
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
