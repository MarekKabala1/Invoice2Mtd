import currencyData from '@/assets/currency.json';

interface Currency {
  country: string;
  countryCode: string;
  currencyName: string;
  currencyCode: string;
  symbol: string;
}
const currencies: Currency[] = currencyData;

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = currencies.find(c => c.currencyCode === currencyCode);
  return currency ? currency.symbol : currencyCode;
};

