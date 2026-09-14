/**
 * Valyuta va ayirboshlash kursi.
 *
 * Uchta nuqson tuzatiladi:
 *  1. Tanlov saqlanmasdi — bosh sahifada UZS ga o'tib, mahsulotni bossangiz
 *     narxlar jimgina USD ga qaytardi.
 *  2. Kurs har marshrut o'rnatilishida qayta so'ralardi: kesh yo'q, bekor
 *     qilish yo'q, timeout yo'q.
 *  3. Javob tekshirilmasdi. Tekshiruv `typeof === 'number'` emas, diapazon
 *     bo'lishi kerak — API `"12800"` satrini qaytarsa `*` uni songa
 *     aylantiradi va muammo sezilmaydi.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS } from './keys';
import { parseCurrency, parseCachedFxRate, parseExchangeRate, type CachedFxRate } from '@/schemas';
import type { Currency } from '@/types';

export const FALLBACK_RATE = 12800;

/** Kursni qayta so'rashdan oldin kutiladigan vaqt. */
const RATE_TTL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const RATE_URL = 'https://open.er-api.com/v6/latest/USD';

const INITIAL_RATE: CachedFxRate = { rate: FALLBACK_RATE, fetchedAt: new Date(0).toISOString() };

export const currencyStore = createPersistentStore<Currency>({
  key: STORAGE_KEYS.currency,
  version: STORAGE_VERSIONS[STORAGE_KEYS.currency],
  fallback: () => 'USD',
  validate: parseCurrency,
});

export const fxRateStore = createPersistentStore<CachedFxRate>({
  key: STORAGE_KEYS.fxRate,
  version: STORAGE_VERSIONS[STORAGE_KEYS.fxRate],
  fallback: () => INITIAL_RATE,
  validate: parseCachedFxRate,
});

export function setCurrency(currency: Currency): void {
  currencyStore.set(currency);
}

export function getExchangeRate(): number {
  return fxRateStore.getSnapshot().rate;
}

function isFresh(cached: CachedFxRate): boolean {
  const age = Date.now() - Date.parse(cached.fetchedAt);
  return Number.isFinite(age) && age >= 0 && age < RATE_TTL_MS;
}

let inFlight: Promise<void> | null = null;

/**
 * Kursni kerak bo'lsa yangilaydi.
 * Bir vaqtda faqat bitta so'rov ketadi va TTL ichida umuman so'ralmaydi.
 */
export function ensureExchangeRate(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (isFresh(fxRateStore.getSnapshot())) return Promise.resolve();
  if (inFlight) return inFlight;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  inFlight = fetch(RATE_URL, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(`FX API ${res.status}`);
      return res.json();
    })
    .then((data: unknown) => {
      const rate = parseExchangeRate(
        typeof data === 'object' && data !== null
          ? (data as { rates?: Record<string, unknown> }).rates?.UZS
          : undefined,
      );
      if (rate === null) return;
      fxRateStore.set({ rate, fetchedAt: new Date().toISOString() });
    })
    .catch(() => {
      // Zaxira kurs ishlatiladi. Narxlar baribir ko'rsatiladi.
    })
    .finally(() => {
      clearTimeout(timer);
      inFlight = null;
    });

  return inFlight;
}
