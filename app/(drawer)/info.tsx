/**
 * info.tsx
 *
 * MTD reference and help screen. Read-only — no forms, no DB calls.
 * Shows tax year info, quarterly deadlines, tax rates, useful links,
 * and invoicing tips.
 *
 * Depends on: context/ThemeContext, utils/mtdTaxCalc.ts, utils/mtdDates.ts
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { RATES_2025_26, formatGBP, parseTaxRates } from '@/utils/mtd/mtdTaxCalc';
import { currentTaxYear, quartersForTaxYear, currentTaxYearStart } from '@/utils/mtd/mtdDates';

function SectionTitle({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Text
      className="text-xs font-bold uppercase tracking-widest mt-6 mb-3"
      style={{ color: colors.noActive }}
    >
      {title}
    </Text>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      className="flex-row justify-between py-2 px-4 rounded-lg mb-1"
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
    >
      <Text className="text-sm flex-1" style={{ color: colors.text }}>
        {label}
      </Text>
      <Text className="text-sm font-bold" style={{ color: colors.text }}>
        {value}
      </Text>
    </View>
  );
}

export default function InfoScreen() {
  const { colors, isDark } = useTheme();
  const { settings } = useAppSettings();
  const rates = parseTaxRates(settings?.taxRatesJson);
  const ty = currentTaxYear();
  const startYear = currentTaxYearStart();
  const quarters = quartersForTaxYear(startYear);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* MTD Overview */}
      <SectionTitle title="MTD for Income Tax — Overview" />
      <View
        className="rounded-lg p-4 mb-2"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <Text className="text-sm leading-5" style={{ color: colors.text }}>
          Making Tax Digital (MTD) for Income Tax is a UK government requirement
          for self-employed individuals and landlords to keep digital records and
          submit quarterly updates to HMRC using compatible software.
        </Text>
        <Text className="text-sm leading-5 mt-3" style={{ color: colors.text }}>
          Instead of one annual Self Assessment tax return, you'll submit updates
          every quarter plus a final declaration at the end of the tax year.
        </Text>
      </View>

      {/* Income Thresholds */}
      <SectionTitle title="Income Thresholds" />
      <View
        className="rounded-lg p-4 mb-2"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <View className="flex-row justify-between py-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <Text className="text-sm" style={{ color: colors.text }}>Over £50,000</Text>
          <Text className="text-sm font-bold" style={{ color: colors.text }}>From 6 April 2026</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <Text className="text-sm" style={{ color: colors.text }}>Over £30,000</Text>
          <Text className="text-sm font-bold" style={{ color: colors.text }}>From 6 April 2027</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-sm" style={{ color: colors.text }}>Over £20,000</Text>
          <Text className="text-sm font-bold" style={{ color: colors.text }}>From 6 April 2028</Text>
        </View>
      </View>

      {/* Quarter Reference */}
      <SectionTitle title={`Quarter Reference — ${ty.label}`} />
      {quarters.map((q) => (
        <View
          key={q.quarter}
          className="rounded-lg p-4 mb-2"
          style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        >
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Q{q.quarter}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.noActive }}>
            Period: {q.periodStart} to {q.periodEnd}
          </Text>
          <Text className="text-xs" style={{ color: colors.noActive }}>
            Deadline: {q.submissionDeadline}
          </Text>
        </View>
      ))}

      {/* Final declaration */}
      <View
        className="rounded-lg p-4 mb-2"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Final Declaration
        </Text>
        <Text className="text-xs mt-1" style={{ color: colors.noActive }}>
          Deadline: {ty.finalDeclarationDeadline}
        </Text>
      </View>

      {/* 2025-26 Tax Rates */}
      <SectionTitle title="2025-26 Tax Rates" />
      <View
        className="rounded-lg p-4 mb-2"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <Row label="Personal allowance" value={formatGBP(rates.personalAllowance)} />
        <Row label="Basic rate (20%)" value={`Up to ${formatGBP(rates.basicRateThreshold)}`} />
        <Row label="Higher rate (40%)" value={`${formatGBP(rates.basicRateThreshold)}–${formatGBP(rates.higherRateThreshold)}`} />
        <Row label="Additional rate (45%)" value={`Above ${formatGBP(rates.higherRateThreshold)}`} />
        <View className="h-px my-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        <Row label="Class 2 NI weekly rate" value={formatGBP(rates.ni2WeeklyRate)} />
        <Row label="Class 2 NI threshold" value={`Profit ≥ ${formatGBP(rates.ni2SmallEarningsException)}`} />
        <Row label="Class 4 NI lower rate" value="6% on £12,570–£50,270" />
        <Row label="Class 4 NI upper rate" value="2% above £50,270" />
        <Text className="text-xs mt-3" style={{ color: colors.noActive }}>
          You can update these rates in Settings → HMRC Tax Rates when they change each April.
        </Text>
      </View>

      {/* Useful Links */}
      <SectionTitle title="Useful Links" />
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
        className="py-3 px-4 rounded-lg mb-1"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        onPress={() =>
          Linking.openURL(
            'https://www.gov.uk/government/collections/self-assessment-detailed-information'
          )
        }
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm" style={{ color: colors.text }}>
            GOV.UK — Self Assessment
          </Text>
          <Ionicons name="open-outline" size={16} color={colors.noActive} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        className="py-3 px-4 rounded-lg mb-2"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        onPress={() =>
          Linking.openURL('https://www.gov.uk/log-in-register-hmrc-online-services')
        }
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm" style={{ color: colors.text }}>
            HMRC App
          </Text>
          <Ionicons name="open-outline" size={16} color={colors.noActive} />
        </View>
      </TouchableOpacity>

      {/* Invoicing Tips */}
      <SectionTitle title="Invoicing Tips" />
      <View
        className="rounded-lg p-4 mb-6"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <Text className="text-sm leading-5" style={{ color: colors.text }}>
          A valid UK invoice must contain:
        </Text>
        <View className="mt-2 gap-1">
          {[
            'Unique invoice number',
            'Invoice date and due date',
            'Your business name and address',
            "Client's name and address",
            'Description of goods/services',
            'Itemised amounts (net, tax, total)',
            'VAT number (if VAT registered)',
            'Bank details for payment',
          ].map((tip) => (
            <View key={tip} className="flex-row items-start gap-2">
              <Text style={{ color: colors.noActive }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.text }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
