import type { Currency } from '@/types';
import { FALLBACK_RATE } from '@/store/currencyStore';

/**
 * UZS uchun guruhlash.
 *
 * Avval `toLocaleString('uz-UZ').replace(/,/g, ' ')` ishlatilardi, lekin
 * `uz-UZ` guruhlash uchun U+00A0 (uzilmas probel) qo'yadi, vergul emas —
 * ya'ni almashtirish hech qachon mos kelmasdi va chiqishda NBSP qolardi.
 * Bu ICU qurilishiga bog'liq edi, ya'ni server va brauzer turlicha natija
 * berib, hidratatsiya nomuvofiqligiga olib kelishi mumkin edi.
 */
const uzsFormatter = new Intl.NumberFormat('uz-UZ', {
  useGrouping: true,
  maximumFractionDigits: 0,
});

function formatUzs(value: number): string {
  return uzsFormatter.format(value).replace(/\u00A0/g, ' ');
}

export const formatPrice = (
  price: number,
  currency: Currency,
  exchangeRate: number = FALLBACK_RATE,
): string => {
  if (!Number.isFinite(price)) return currency === 'UZS' ? "0 so'm" : '$0.00';

  if (currency === 'UZS') {
    const rate = Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : FALLBACK_RATE;
    return `${formatUzs(Math.round(price * rate))} so'm`;
  }
  return `$${price.toFixed(2)}`;
};

/** Tostlarda "1$ = 12 800 so'm" ko'rinishidagi matn uchun. */
export const formatExchangeRate = (rate: number): string => formatUzs(Math.round(rate));
