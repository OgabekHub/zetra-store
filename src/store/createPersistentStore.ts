/**
 * `useSyncExternalStore` bilan ishlaydigan, `localStorage` da saqlanadigan
 * kichik store fabrikasi.
 *
 * Nima uchun kontekst + `useEffect` emas: `react-hooks/set-state-in-effect`
 * React 19 da xato darajasida, va u aynan "effekt ichida localStorage dan
 * o'qib setState qilish" naqshiga urishadi — loyihadagi 11 ta xatoning 7 tasi
 * shundan. `useSyncExternalStore` esa effektsiz ishlaydi va `getServerSnapshot`
 * orqali SSR/hidratatsiya nomuvofiqligini konstruksiya bo'yicha yo'q qiladi.
 *
 * Ikkita buzilmaydigan qoida:
 *  1. `getSnapshot` referensial jihatdan barqaror qiymat qaytarishi shart.
 *     Har chaqiruvda `JSON.parse` qilish React'ni cheksiz siklga soladi.
 *  2. `getServerSnapshot` modul darajasidagi standart qiymatni qaytaradi va
 *     hech qachon `localStorage` ga qaramaydi.
 */
import {
  readRaw,
  readValidated,
  writeValidated,
  removeKey,
  subscribeToKey,
  isStorageAvailable,
} from './storage';

export interface PersistentStore<T> {
  readonly key: string;
  /** Keshlangan, barqaror snapshot. `useSyncExternalStore` ga berish xavfsiz. */
  getSnapshot(): T;
  /** SSR va hidratatsiya uchun standart qiymat. */
  getServerSnapshot(): T;
  set(next: T | ((prev: T) => T)): void;
  reset(): void;
  subscribe(onChange: () => void): () => void;
  /** Yozish kvota sababli muvaffaqiyatsiz bo'lgan yoki saqlash mavjud emas. */
  isDegraded(): boolean;
}

export interface PersistentStoreOptions<T> {
  key: string;
  version: number;
  /** SSR uchun, kalit yo'q bo'lganda va rad etilgan qiymat uchun. Sof bo'lishi shart. */
  fallback: () => T;
  /** Sxema tekshiruvi. Yaroqsiz bo'lsa `null`. */
  validate: (raw: unknown) => T | null;
  migrate?: (fromVersion: number, data: unknown) => T | null;
  /** Standart `true`. Tab'lar orasida ergashmasligi kerak bo'lgan qiymatlar uchun `false`. */
  crossTab?: boolean;
}

export function createPersistentStore<T>(options: PersistentStoreOptions<T>): PersistentStore<T> {
  const { key, version, fallback, validate, migrate, crossTab = true } = options;

  // Modul darajasidagi standart: hech qachon o'zgarmaydi, shuning uchun
  // `getServerSnapshot` har safar bir xil havolani qaytaradi.
  const serverSnapshot = fallback();

  let cachedValue: T = serverSnapshot;
  /** Oxirgi ko'rilgan xom satr. Keraksiz qayta parse qilmaslik uchun. */
  let cachedRaw: string | null = null;
  /** `localStorage` dan hech bo'lmaganda bir marta o'qildimi. */
  let hydrated = false;
  let degraded = !isStorageAvailable();
  let warnedInvalid = false;
  /**
   * O'z yozuvimiz davom etayotganini bildiradi. `writeValidated` shu tab
   * uchun hodisa chiqaradi; busiz store o'z yozuvini tashqi o'zgarish deb
   * qabul qilib, qiymatni qayta parse qilar va obunachilarni ikki marta
   * xabardor qilardi.
   */
  let writing = false;

  const listeners = new Set<() => void>();
  let unsubscribeStorage: (() => void) | null = null;

  function notify(): void {
    for (const listener of listeners) listener();
  }

  function persist(value: T): void {
    writing = true;
    try {
      const result = writeValidated(key, version, value);
      if (!result.ok) {
        degraded = true;
        return;
      }
      degraded = false;
      cachedRaw = readRaw(key);
    } finally {
      writing = false;
    }
  }

  /** `localStorage` dan o'qiydi, tekshiradi, kerak bo'lsa zaharlangan qiymatni tuzatadi. */
  function loadFromStorage(): T {
    const result = readValidated(key, version, validate, migrate);
    if (result.ok) {
      // Eski formatdan o'tkazilgan qiymat darhol yangi formatda yoziladi,
      // shunda migratsiya har yuklashda qayta ishlamaydi.
      if (result.migrated) persist(result.value);
      return result.value;
    }

    if ((result.reason === 'invalid' || result.reason === 'malformed') && !warnedInvalid) {
      warnedInvalid = true;
      console.warn(
        `[zetra] "${key}" da yaroqsiz qiymat topildi (${result.reason}). Standart qiymatga qaytarildi.`,
      );
    }

    const value = fallback();
    // Zaharlangan qiymatni ustiga yozamiz, aks holda foydalanuvchi har
    // yuklashda o'sha ogohlantirishga qaytaveradi.
    if (
      result.reason === 'invalid' ||
      result.reason === 'malformed' ||
      result.reason === 'version'
    ) {
      persist(value);
    }
    return value;
  }

  /** Xom satr o'zgargan bo'lsa keshni yangilaydi. `true` qaytarsa qiymat o'zgardi. */
  function refreshFromStorage(): boolean {
    const raw = readRaw(key);
    if (hydrated && raw === cachedRaw) return false;
    cachedRaw = raw;
    cachedValue = loadFromStorage();
    hydrated = true;
    return true;
  }

  function getSnapshot(): T {
    // Birinchi chaqiruvda `localStorage` dan o'qiladi; keyin faqat xotiradan.
    // Boshqa tabdagi o'zgarish obuna orqali keshni yangilaydi, shuning uchun
    // bu yerda har renderda `localStorage` ga murojaat qilish shart emas.
    if (!hydrated && isStorageAvailable()) {
      refreshFromStorage();
    }
    return cachedValue;
  }

  function set(next: T | ((prev: T) => T)): void {
    const prev = getSnapshot();
    const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
    if (Object.is(value, prev)) return;

    // Xotiradagi holat hokim: saqlash muvaffaqiyatsiz bo'lsa ham UI yangilanadi.
    cachedValue = value;
    hydrated = true;
    persist(value);
    notify();
  }

  function reset(): void {
    cachedValue = fallback();
    cachedRaw = null;
    hydrated = true;
    removeKey(key);
    notify();
  }

  function subscribe(onChange: () => void): () => void {
    listeners.add(onChange);

    // Butun store uchun bitta `storage` obunasi: birinchi tinglovchi kelganda
    // ochiladi, oxirgisi ketganda yopiladi.
    if (crossTab && unsubscribeStorage === null) {
      unsubscribeStorage = subscribeToKey(key, () => {
        if (writing) return;
        if (refreshFromStorage()) notify();
      });
    }

    return () => {
      listeners.delete(onChange);
      if (listeners.size === 0 && unsubscribeStorage !== null) {
        unsubscribeStorage();
        unsubscribeStorage = null;
      }
    };
  }

  return {
    key,
    getSnapshot,
    getServerSnapshot: () => serverSnapshot,
    set,
    reset,
    subscribe,
    isDegraded: () => degraded,
  };
}
