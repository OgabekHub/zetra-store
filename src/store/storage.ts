/**
 * `localStorage` ustidagi xavfsiz qatlam.
 *
 * Loyihada avval 15 ta `JSON.parse` bor edi, ulardan 10 tasi `try/catch` siz va
 * bir nechtasi `useEffect` ichida — ya'ni bitta buzilgan qiymat butun React
 * daraxtini yiqitardi. Birorta `setItem` ham himoyalanmagan edi, shuning uchun
 * Safari private mode'da `QuotaExceededError` to'g'ridan-to'g'ri chiqardi.
 *
 * Bu modul hech qachon istisno tashlamaydi.
 */

/** Har bir Zetra kaliti shu konvert ichida saqlanadi. */
export interface StorageEnvelope<T> {
  v: number;
  data: T;
}

export type ReadFailure = 'unavailable' | 'missing' | 'malformed' | 'invalid' | 'version';
export type ReadResult<T> =
  | {
      ok: true;
      value: T;
      /** Qiymat eski formatdan o'tkazildi va yangi formatda qayta yozilishi kerak. */
      migrated?: true;
    }
  | { ok: false; reason: ReadFailure };

export type WriteFailure = 'unavailable' | 'quota' | 'serialize';
export type WriteResult = { ok: true } | { ok: false; reason: WriteFailure };

/** Bir xil tabda yozuvni bildirish uchun hodisa nomi (`storage` hodisasi yozgan tabda ishlamaydi). */
const SAME_TAB_EVENT = 'zetra:storage';

let availabilityCache: boolean | null = null;

/**
 * `localStorage` haqiqatan ishlaydimi.
 * SSR paytida va Safari private mode'da `false`.
 */
export function isStorageAvailable(): boolean {
  if (availabilityCache !== null) return availabilityCache;
  if (typeof window === 'undefined') return false;
  try {
    const probe = '__zetra_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    availabilityCache = true;
  } catch {
    availabilityCache = false;
  }
  return availabilityCache;
}

/** Xom satrni o'qiydi. Hech qachon tashlamaydi. */
export function readRaw(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * O'qish + konvertni ochish + sxema tekshiruvi.
 *
 * `validate` yaroqsiz qiymat uchun `null` qaytaradi.
 * `migrate` saqlangan versiya joriysidan kichik bo'lganda chaqiriladi.
 */
export function readValidated<T>(
  key: string,
  version: number,
  validate: (raw: unknown) => T | null,
  migrate?: (fromVersion: number, data: unknown) => T | null,
): ReadResult<T> {
  if (!isStorageAvailable()) return { ok: false, reason: 'unavailable' };

  const raw = readRaw(key);
  if (raw === null) return { ok: false, reason: 'missing' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Eski kod ba'zi qiymatlarni JSON'siz, xom satr sifatida yozardi
    // (masalan, `localStorage.setItem('zetra-theme', 'light')`). Migratsiya
    // berilgan bo'lsa xom satr unga uzatiladi — aks holda foydalanuvchining
    // saqlangan tanlovi "buzilgan" deb o'chirilib ketardi.
    if (!migrate) return { ok: false, reason: 'malformed' };
    const migratedRaw = migrate(0, raw);
    return migratedRaw === null
      ? { ok: false, reason: 'malformed' }
      : { ok: true, value: migratedRaw, migrated: true };
  }

  // Konvertsiz eski qiymat ham qabul qilinadi — migratsiyagacha yozilganlar uchun.
  const hasEnvelope =
    typeof parsed === 'object' &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    'v' in parsed &&
    'data' in parsed &&
    typeof (parsed as StorageEnvelope<unknown>).v === 'number';

  const storedVersion = hasEnvelope ? (parsed as StorageEnvelope<unknown>).v : 0;
  const payload = hasEnvelope ? (parsed as StorageEnvelope<unknown>).data : parsed;

  if (storedVersion < version) {
    // Migratsiya berilmagan bo'lsa, eski qiymat joriy sxemaga mos kelsa
    // saqlanadi. Avval u to'g'ridan-to'g'ri tashlanardi va qaytib kelgan
    // foydalanuvchining savati bo'shab qolardi.
    const migrated = migrate ? migrate(storedVersion, payload) : validate(payload);
    if (migrated === null) return { ok: false, reason: 'version' };
    return { ok: true, value: migrated, migrated: true };
  }

  const value = validate(payload);
  if (value === null) return { ok: false, reason: 'invalid' };
  return { ok: true, value };
}

/** Konvertga o'rab yozadi. `QuotaExceededError` ni tutadi. */
export function writeValidated<T>(key: string, version: number, value: T): WriteResult {
  if (!isStorageAvailable()) return { ok: false, reason: 'unavailable' };

  let serialized: string;
  try {
    serialized = JSON.stringify({ v: version, data: value } satisfies StorageEnvelope<T>);
  } catch {
    return { ok: false, reason: 'serialize' };
  }

  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    // Kvota tugagan yoki yozish taqiqlangan. Ilova ishlashda davom etadi.
    return { ok: false, reason: 'quota' };
  }

  notifySameTab(key);
  return { ok: true };
}

export function removeKey(key: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
  notifySameTab(key);
}

function notifySameTab(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: { key } }));
  } catch {
    // CustomEvent qo'llab-quvvatlanmasa jim o'tamiz.
  }
}

/**
 * Kalit o'zgarishini tinglaydi.
 *
 * - boshqa tab: `storage` hodisasi (yozgan tabning o'zida ishlamaydi — shuning
 *   uchun bir xil tab uchun alohida CustomEvent kerak).
 * - `e.key === null` — boshqa tab `localStorage.clear()` chaqirgan.
 *
 * SSR paytida hech narsa qilmaydi va bo'sh funksiya qaytaradi.
 */
export function subscribeToKey(key: string, onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === key) onChange();
  };
  const handleSameTab = (e: Event) => {
    const detail = (e as CustomEvent<{ key: string }>).detail;
    if (!detail || detail.key === key) onChange();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(SAME_TAB_EVENT, handleSameTab);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SAME_TAB_EVENT, handleSameTab);
  };
}

/** Testlar va migratsiya uchun: keshlangan mavjudlik bayrog'ini tiklaydi. */
export function resetStorageAvailabilityCache(): void {
  availabilityCache = null;
}
