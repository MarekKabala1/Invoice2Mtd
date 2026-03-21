import { InvoiceForUpdate } from '@/types';
import { AppSettingsType } from '@/db/zodSchema';
import { getReorderedQuarters } from './yearQuarters';

export interface GroupedByFinancialYear {
  yearLabel: string;
  quarters: {
    quarterLabel: string;
    invoices: InvoiceForUpdate[];
  }[];
}

export function groupInvoicesByFinancialYearAndQuarter(
  invoices: InvoiceForUpdate[],
  settings: AppSettingsType
): GroupedByFinancialYear[] {
  const startMonth = settings.financialYearStartMonth || 1;
  const startDay = settings.financialYearStartDay || 1;
  const quarterMonths = (settings.quarterStartMonths || '1,4,7,10')
    .split(',')
    .map(Number);

  function getFinancialYear(date: Date) {
    const fyStart = new Date(date.getFullYear(), startMonth - 1, startDay);
    if (date < fyStart) {
      return `${date.getFullYear() - 1}/${date.getFullYear()}`;
    }
    return `${date.getFullYear()}/${date.getFullYear() + 1}`;
  }

  const selectedValue = settings.quarterStartMonths || '1,4,7,10';
  const reorderedQuarters = getReorderedQuarters(selectedValue).slice(0, 4);
  const monthToQuarter: { [month: number]: number } = {};
  const labelMap: { [idx: number]: string } = {};
  for (let i = 0; i < reorderedQuarters.length; i++) {
    const months = reorderedQuarters[i].value.split(',').map(Number);
    for (const m of months) {
      monthToQuarter[m] = i + 1;
    }
    labelMap[i + 1] = reorderedQuarters[i].label;
  }
  function getQuarter(date: Date) {
    const month = date.getMonth() + 1;
    const idx = monthToQuarter[month] || reorderedQuarters.length;
    return labelMap[idx] || `Q${idx}`;
  }

  const grouped: { [year: string]: { [quarter: string]: InvoiceForUpdate[] } } = {};

  for (const invoice of invoices) {
    const date = new Date(invoice.invoiceDate);
    const yearLabel = getFinancialYear(date);
    const quarterLabel = getQuarter(date);
    if (!grouped[yearLabel]) grouped[yearLabel] = {};
    if (!grouped[yearLabel][quarterLabel]) grouped[yearLabel][quarterLabel] = [];
    grouped[yearLabel][quarterLabel].push(invoice);
  }

  function quarterSortKey(q: string) {
    for (let i = 1; i <= 4; i++) {
      if (labelMap[i] === q) return i - 1;
    }
    return 99;
  }

  return Object.entries(grouped)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([yearLabel, quartersObj]) => ({
      yearLabel,
      quarters: Object.entries(quartersObj)
        .sort((a, b) => quarterSortKey(a[0]) - quarterSortKey(b[0]))
        .map(([quarterLabel, invoices]) => ({ quarterLabel, invoices })),
    }));
}
