/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CurrencyConfig {
  code: string;
  nameAr: string;
  symbolAr: string;
  symbolEn: string;
  flag: string;
  defaultRate: number; // Against USD = 1.0
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'SAR', nameAr: 'ريال سعودي', symbolAr: 'ر.س', symbolEn: 'SAR', flag: '🇸🇦', defaultRate: 3.75, decimals: 2 },
  { code: 'USD', nameAr: 'دولار أمريكي', symbolAr: '$', symbolEn: '$', flag: '🇺🇸', defaultRate: 1.0, decimals: 2 },
  { code: 'EUR', nameAr: 'يورو أوروبي', symbolAr: '€', symbolEn: '€', flag: '🇪🇺', defaultRate: 0.92, decimals: 2 },
  { code: 'AED', nameAr: 'درهم إماراتي', symbolAr: 'د.إ', symbolEn: 'AED', flag: '🇦🇪', defaultRate: 3.67, decimals: 2 },
  { code: 'YER', nameAr: 'ريال يمني', symbolAr: 'ر.ي', symbolEn: 'YR', flag: '🇾🇪', defaultRate: 250.0, decimals: 0 },
  { code: 'KWD', nameAr: 'دينار كويتي', symbolAr: 'د.ك', symbolEn: 'KWD', flag: '🇰🇼', defaultRate: 0.31, decimals: 3 },
  { code: 'QAR', nameAr: 'ريال قطري', symbolAr: 'ر.ق', symbolEn: 'QAR', flag: '🇶🇦', defaultRate: 3.64, decimals: 2 },
  { code: 'BHD', nameAr: 'دينار بحريني', symbolAr: 'د.ب', symbolEn: 'BHD', flag: '🇧🇭', defaultRate: 0.376, decimals: 3 },
  { code: 'OMR', nameAr: 'ريال عماني', symbolAr: 'ر.ع', symbolEn: 'OMR', flag: '🇴🇲', defaultRate: 0.385, decimals: 3 },
  { code: 'EGP', nameAr: 'جنيه مصري', symbolAr: 'ج.م', symbolEn: 'EGP', flag: '🇪🇬', defaultRate: 48.5, decimals: 2 },
  { code: 'JOD', nameAr: 'دينار أردني', symbolAr: 'د.أ', symbolEn: 'JOD', flag: '🇯🇴', defaultRate: 0.709, decimals: 3 },
  { code: 'GBP', nameAr: 'جنيه إسترليني', symbolAr: '£', symbolEn: '£', flag: '🇬🇧', defaultRate: 0.78, decimals: 2 },
  { code: 'TRY', nameAr: 'ليرة تركية', symbolAr: '₺', symbolEn: 'TL', flag: '🇹🇷', defaultRate: 33.5, decimals: 2 },
];

export const DEFAULT_RATES: { [currencyCode: string]: number } = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr.defaultRate;
  return acc;
}, {} as { [key: string]: number });

export function getCurrencyInfo(code: string): CurrencyConfig {
  const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
  if (found) return found;
  return {
    code: code || 'YER',
    nameAr: code || 'ريال',
    symbolAr: code || 'ر.ي',
    symbolEn: code || 'YR',
    flag: '🌐',
    defaultRate: 1.0,
    decimals: 2
  };
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'YER',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
    useArabicNumerals?: boolean;
  } = {}
): string {
  const info = getCurrencyInfo(currencyCode);
  const decimals = options.decimals !== undefined ? options.decimals : (info.decimals || 2);
  const formattedNumber = (amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals === 0 ? 0 : 2,
    maximumFractionDigits: decimals
  });

  const label = options.showSymbol ? info.symbolAr : options.showCode ? info.code : info.symbolAr;
  return `${formattedNumber} ${label}`;
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: { [key: string]: number } = DEFAULT_RATES
): number {
  if (!amount || fromCurrency === toCurrency) return amount || 0;

  const fromRate = rates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1.0;
  const toRate = rates[toCurrency] || DEFAULT_RATES[toCurrency] || 1.0;

  // Convert from source currency to USD base (1 USD = X source)
  const amountInUSD = amount / fromRate;
  // Convert USD base to target currency (1 USD = Y target)
  return amountInUSD * toRate;
}

export async function fetchLiveExchangeRates(currentRates: { [key: string]: number } = DEFAULT_RATES): Promise<{
  rates: { [key: string]: number };
  timestamp: string;
  success: boolean;
}> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error('فشل جلب الأسعار من مزود خدمة أسعار الصرف');
    const data = await response.json();

    if (data && data.rates) {
      const mergedRates: { [key: string]: number } = { ...DEFAULT_RATES, ...currentRates, USD: 1.0 };

      SUPPORTED_CURRENCIES.forEach(curr => {
        if (curr.code === 'USD') {
          mergedRates.USD = 1.0;
        } else if (data.rates[curr.code] !== undefined) {
          mergedRates[curr.code] = Number(data.rates[curr.code]);
        }
      });

      return {
        rates: mergedRates,
        timestamp: new Date().toISOString(),
        success: true
      };
    }
    return { rates: currentRates, timestamp: new Date().toISOString(), success: false };
  } catch (error) {
    console.warn('Exchange rates fetch error, using saved fallback rates:', error);
    return { rates: currentRates, timestamp: new Date().toISOString(), success: false };
  }
}
