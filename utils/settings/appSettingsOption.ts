const options = {
  dateFormat: [
    { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  ],
  numberFormat: [
    { label: 'en-GB', value: 'en-GB' },
    { label: 'en-US', value: 'en-US' },
    { label: 'pl-PL', value: 'pl-PL' },
  ],
  currency: [
    { label: 'GBP (£)', value: 'GBP' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'PLN (zł)', value: 'PLN' },
  ],
  language: [
    { label: 'English (UK)', value: 'en-GB' },
    { label: 'English (US)', value: 'en-US' },
    { label: 'Polski', value: 'pl-PL' },
  ],
  theme: [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ],
  taxScheme: [
    { label: 'Standard', value: 'standard' },
    { label: 'Flat Rate', value: 'flat-rate' },
    { label: 'Cash Accounting', value: 'cash-accounting' },
  ],
  defaultTaxCategory: [
    { label: 'Self-Employed', value: 'self-employed' },
    { label: 'LTD', value: 'ltd' },
    { label: 'Partnership', value: 'partnership' },
  ],
  quarters: [
    { label: 'Q1 (Jan-Mar)', value: '1,2,3' },
    { label: 'Q2 (Apr-Jun)', value: '4,5,6' },
    { label: 'Q3 (Jul-Sep)', value: '7,8,9' },
    { label: 'Q4 (Oct-Dec)', value: '10,11,12' },
    { label: 'Custom', value: 'custom' },
  ],
  months: [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ],
  days: Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  })),
  financialYearPresets: [
    {
      label: 'Standard UK Tax Year',
      value: 'uk',
      description: '6 Apr – 5 Apr (HMRC standard)',
      startMonth: 4,
      startDay: 6,
      endMonth: 4,
      endDay: 5,
      quarterMonths: '4,7,10,1',
    },
    {
      label: 'Calendar Year',
      value: 'calendar',
      description: '1 Jan – 31 Dec',
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      quarterMonths: '1,4,7,10',
    },
    { label: 'Custom', value: 'custom', description: 'Set your own dates' },
  ],
};

export type FinancialYearPreset = (typeof options.financialYearPresets)[number];

export default options;