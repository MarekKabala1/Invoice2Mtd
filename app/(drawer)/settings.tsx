/**
 * settings.tsx
 *
 * Settings screen accessible from the drawer. Consolidates all app
 * configuration: Profile, Bank Details, Tax Defaults, Invoice Numbers,
 * MTD & Tax, Appearance, Reminders, About.
 *
 * Depends on: context/AppSettingsContext, context/ThemeContext,
 *             hooks/useAppSettings
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { formatGBP, RATES_2025_26, parseTaxRates, serializeTaxRates } from '@/utils/mtdTaxCalc';
import { TaxRates } from '@/types/mtd';
import ThemeToggle from '@/components/ThemeToggle';

function SectionHeader({ title }: { title: string }) {
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

function SettingsRow({
  label,
  value,
  onPress,
  showArrow = true,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}) {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-3 px-4 rounded-lg mb-1"
      style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text className="text-sm flex-1" style={{ color: colors.text }}>
        {label}
      </Text>
      {value && (
        <Text className="text-sm mr-2" style={{ color: colors.noActive }}>
          {value}
        </Text>
      )}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.noActive} />
      )}
    </TouchableOpacity>
  );
}

function SettingsToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      className="flex-row items-center justify-between py-3 px-4 rounded-lg mb-1"
      style={{ backgroundColor: isDark ? colors.nav : colors.card }}
    >
      <Text className="text-sm flex-1" style={{ color: colors.text }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', true: '#39AD6A' }}
        thumbColor={value ? 'white' : isDark ? '#F3EDE2' : '#8B5E3C'}
      />
    </View>
  );
}

function SettingsInputRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      className="py-3 px-4 rounded-lg mb-1"
      style={{ backgroundColor: isDark ? colors.nav : colors.card }}
    >
      <Text className="text-xs mb-1" style={{ color: colors.noActive }}>
        {label}
      </Text>
      <TextInput
        className="text-sm p-0"
        style={{ color: colors.text }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.noActive}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { settings, update } = useAppSettings();

  // Local state for live preview
  const [previewRate, setPreviewRate] = useState(
    String(settings?.defaultVatRate ?? 20)
  );
  const [previewPrefix, setPreviewPrefix] = useState(
    settings?.invoicePrefix ?? 'INV'
  );
  const [previewNextNum, setPreviewNextNum] = useState(
    String(settings?.nextInvoiceNumber ?? 1)
  );

  // Tax rates state — parsed from settings or defaults
  const currentRates = parseTaxRates(settings?.taxRatesJson);
  const [taxRates, setTaxRates] = useState<TaxRates>(currentRates);
  const [showRates, setShowRates] = useState(false);

  const saveRate = (key: keyof TaxRates, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updated = { ...taxRates, [key]: num };
    setTaxRates(updated);
    update({ taxRatesJson: serializeTaxRates(updated) });
  };

  const resetRatesToDefaults = () => {
    setTaxRates({ ...RATES_2025_26 });
    update({ taxRatesJson: serializeTaxRates(RATES_2025_26) });
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? '—';

  // Tax Defaults live preview
  const taxRate = parseFloat(previewRate) || 0;
  const scheme = settings?.taxScheme ?? 'standard';
  const sampleNet = 100;
  const sampleTax =
    scheme === 'standard'
      ? sampleNet * (taxRate / 100)
      : sampleNet - sampleNet / (1 + taxRate / 100);
  const sampleTotal =
    scheme === 'standard' ? sampleNet + sampleTax : sampleNet;

  // Invoice number preview
  const paddedNum = String(Math.max(1, parseInt(previewNextNum) || 1)).padStart(
    3,
    '0'
  );

  if (!settings) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.primary }}
      >
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Section 1: Profile */}
      <SectionHeader title="Profile" />
      <SettingsRow
        label="Full name"
        value={settings?.userId ? 'Tap to edit' : undefined}
        onPress={() => router.push('/(stack)/(user)/userInfoForm')}
      />
      <SettingsRow
        label="Bank details"
        onPress={() => router.push('/(stack)/(user)/bankDetailsForm')}
      />

      {/* Section 2: Tax Defaults */}
      <SectionHeader title="Tax Defaults" />
      <SettingsInputRow
        label="Default tax rate (%)"
        value={previewRate}
        onChangeText={(text) => {
          setPreviewRate(text);
          const num = parseFloat(text);
          if (!isNaN(num)) update({ defaultVatRate: num });
        }}
        placeholder="20"
        keyboardType="decimal-pad"
      />
      {/* Tax scheme toggle */}
      <View
        className="py-3 px-4 rounded-lg mb-1"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <Text className="text-xs mb-2" style={{ color: colors.noActive }}>
          Tax calculation mode
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{
              backgroundColor:
                scheme === 'standard'
                  ? isDark ? '#4f46e5' : '#4338ca'
                  : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}
            onPress={() => update({ taxScheme: 'standard' })}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: scheme === 'standard' ? 'white' : colors.text }}
            >
              Add on top
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{
              backgroundColor:
                scheme === 'inclusive'
                  ? isDark ? '#4f46e5' : '#4338ca'
                  : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}
            onPress={() => update({ taxScheme: 'inclusive' })}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: scheme === 'inclusive' ? 'white' : colors.text }}
            >
              Inclusive
            </Text>
          </TouchableOpacity>
        </View>
        {/* Live preview */}
        <View
          className="mt-3 p-3 rounded-lg"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
        >
          <Text className="text-xs" style={{ color: colors.noActive }}>
            Invoice for {formatGBP(sampleNet)} → Tax {formatGBP(sampleTax)} → Total{' '}
            {formatGBP(sampleTotal)}
          </Text>
        </View>
      </View>
      <SettingsToggleRow
        label="Apply tax by default"
        value={settings?.applyTaxByDefault ?? true}
        onToggle={(val) => update({ applyTaxByDefault: val })}
      />
      <SettingsInputRow
        label="Default payment terms (days)"
        value={String(settings?.defaultPaymentTerms ?? 30)}
        onChangeText={(text) => {
          const num = parseInt(text);
          if (!isNaN(num)) update({ defaultPaymentTerms: num });
        }}
        placeholder="30"
        keyboardType="numeric"
      />

      {/* Section 3: Invoice & Estimate Numbers */}
      <SectionHeader title="Invoice & Estimate Numbers" />
      <SettingsInputRow
        label="Invoice prefix"
        value={previewPrefix}
        onChangeText={(text) => {
          setPreviewPrefix(text);
          update({ invoicePrefix: text });
        }}
        placeholder="INV"
      />
      <SettingsInputRow
        label="Next invoice number"
        value={previewNextNum}
        onChangeText={(text) => {
          setPreviewNextNum(text);
          const num = parseInt(text);
          if (!isNaN(num)) update({ nextInvoiceNumber: num });
        }}
        placeholder="1"
        keyboardType="numeric"
      />
      <View
        className="py-3 px-4 rounded-lg mb-1"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <Text className="text-xs" style={{ color: colors.noActive }}>
          Next invoice: {previewPrefix}-{paddedNum}
        </Text>
      </View>

      {/* Section 4: MTD & Tax */}
      <SectionHeader title="MTD & Tax" />
      <SettingsToggleRow
        label="MTD quarterly updates"
        value={settings?.quarterlyTaxEnabled ?? true}
        onToggle={(val) => update({ quarterlyTaxEnabled: val })}
      />
      <SettingsToggleRow
        label="Auto-calculate quarters"
        value={settings?.autoCalculateQuarters ?? true}
        onToggle={(val) => update({ autoCalculateQuarters: val })}
      />
      <SettingsInputRow
        label="Deadline reminder (days)"
        value={String(settings?.quarterlyTaxReminderDays ?? 7)}
        onChangeText={(text) => {
          const num = parseInt(text);
          if (!isNaN(num)) update({ quarterlyTaxReminderDays: num });
        }}
        placeholder="7"
        keyboardType="numeric"
      />

      {/* Section 4b: HMRC Tax Rates */}
      <SectionHeader title="HMRC Tax Rates" />
      <TouchableOpacity
        className="py-3 px-4 rounded-lg mb-1 flex-row items-center justify-between"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        onPress={() => setShowRates(!showRates)}
      >
        <Text className="text-sm" style={{ color: colors.text }}>
          Income Tax & NI rates
        </Text>
        <Ionicons
          name={showRates ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.noActive}
        />
      </TouchableOpacity>
      <Text className="text-xs mb-2 px-1" style={{ color: colors.noActive }}>
        Update each April when HMRC publishes new rates. Currently set to 2025-26 defaults.
      </Text>
      {showRates && (
        <View className="gap-1 mb-2">
          <SettingsInputRow
            label="Personal allowance (£)"
            value={String(taxRates.personalAllowance)}
            onChangeText={(v) => saveRate('personalAllowance', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Basic rate threshold (£)"
            value={String(taxRates.basicRateThreshold)}
            onChangeText={(v) => saveRate('basicRateThreshold', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Higher rate threshold (£)"
            value={String(taxRates.higherRateThreshold)}
            onChangeText={(v) => saveRate('higherRateThreshold', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Basic rate (e.g. 0.20)"
            value={String(taxRates.basicRate)}
            onChangeText={(v) => saveRate('basicRate', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Higher rate (e.g. 0.40)"
            value={String(taxRates.higherRate)}
            onChangeText={(v) => saveRate('higherRate', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Additional rate (e.g. 0.45)"
            value={String(taxRates.additionalRate)}
            onChangeText={(v) => saveRate('additionalRate', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Class 4 NI lower limit (£)"
            value={String(taxRates.ni4LowerProfitsLimit)}
            onChangeText={(v) => saveRate('ni4LowerProfitsLimit', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Class 4 NI upper limit (£)"
            value={String(taxRates.ni4UpperProfitsLimit)}
            onChangeText={(v) => saveRate('ni4UpperProfitsLimit', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Class 4 NI lower rate (e.g. 0.06)"
            value={String(taxRates.ni4LowerRate)}
            onChangeText={(v) => saveRate('ni4LowerRate', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Class 4 NI upper rate (e.g. 0.02)"
            value={String(taxRates.ni4UpperRate)}
            onChangeText={(v) => saveRate('ni4UpperRate', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Class 2 NI weekly rate (£)"
            value={String(taxRates.ni2WeeklyRate)}
            onChangeText={(v) => saveRate('ni2WeeklyRate', v)}
            keyboardType="decimal-pad"
          />
          <SettingsInputRow
            label="Class 2 NI threshold (£)"
            value={String(taxRates.ni2SmallEarningsException)}
            onChangeText={(v) => saveRate('ni2SmallEarningsException', v)}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity
            className="py-3 px-4 rounded-lg mt-2 items-center"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            onPress={resetRatesToDefaults}
          >
            <Text className="text-sm font-bold" style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}>
              Reset to 2025-26 defaults
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section 5: Appearance */}
      <SectionHeader title="Appearance" />
      <View
        className="py-3 px-4 rounded-lg mb-1"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        <Text className="text-xs mb-2" style={{ color: colors.noActive }}>
          Theme
        </Text>
        <ThemeToggle size={26} />
      </View>
      <SettingsRow
        label="Currency"
        value={settings?.currency ?? 'GBP'}
        onPress={() => {
          // Cycle through common currencies
          const currencies = ['GBP', 'EUR', 'USD', 'PLN'];
          const current = settings?.currency ?? 'GBP';
          const idx = currencies.indexOf(current);
          const next = currencies[(idx + 1) % currencies.length];
          update({ currency: next });
        }}
      />

      {/* Section 6: Reminders */}
      <SectionHeader title="Reminders" />
      <SettingsToggleRow
        label="Invoice payment reminders"
        value={settings?.reminderEmailEnabled ?? true}
        onToggle={(val) => update({ reminderEmailEnabled: val })}
      />
      <SettingsInputRow
        label="Remind days before due"
        value={String(settings?.reminderDaysBeforeDue ?? 3)}
        onChangeText={(text) => {
          const num = parseInt(text);
          if (!isNaN(num)) update({ reminderDaysBeforeDue: num });
        }}
        placeholder="3"
        keyboardType="numeric"
      />

      {/* Section 7: About */}
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
        className="py-3 px-4 rounded-lg mb-6"
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        onPress={() =>
          Linking.openURL('https://github.com/MarekKabala1/Invoice2Mtd/issues')
        }
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm" style={{ color: colors.text }}>
            Report a bug / give feedback
          </Text>
          <Ionicons name="open-outline" size={16} color={colors.noActive} />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
