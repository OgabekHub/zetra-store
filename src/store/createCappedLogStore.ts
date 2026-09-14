/**
 * Chegaralangan, faqat qo'shiladigan jurnal store'i.
 *
 * `zetra-security-logs` va `zetra-sessions` avval cheksiz o'sardi — har login,
 * har noto'g'ri OTP, har qayta yuborish, har modal ochilishida bitta qator,
 * hech qanday chegara yoki tozalashsiz.
 *
 * Elementlar alohida tekshiriladi: bitta buzilgan qator o'sha qatorni tashlaydi,
 * foydalanuvchining butun tarixini emas. Faqat qo'shiladigan ma'lumot uchun bu
 * massiv darajasidagi tekshiruvdan ancha yaxshi.
 */
import { createPersistentStore, type PersistentStore } from './createPersistentStore';
import { parseArrayOf } from '@/utils/guards';

export interface CappedLogStore<T> extends PersistentStore<T[]> {
  /** Boshiga qo'shadi va chegaradan oshganini kesadi. */
  append(entry: T): void;
  appendMany(entries: T[]): void;
  /** Predikat `true` qaytargan yozuvlarni qoldiradi. */
  prune(predicate: (entry: T) => boolean): void;
}

export interface CappedLogStoreOptions<T> {
  key: string;
  version: number;
  /** Qattiq chegara, har qo'shishda qo'llanadi. */
  max: number;
  /** Element tekshiruvi. Yaroqsiz element jimgina tashlanadi. */
  validateEntry: (raw: unknown) => T | null;
}

const EMPTY: never[] = [];

export function createCappedLogStore<T>(options: CappedLogStoreOptions<T>): CappedLogStore<T> {
  const { key, version, max, validateEntry } = options;

  const base = createPersistentStore<T[]>({
    key,
    version,
    fallback: () => EMPTY,
    validate: (raw) => {
      const parsed = parseArrayOf(raw, validateEntry, true);
      return parsed === null ? null : parsed.slice(0, max);
    },
  });

  return {
    ...base,
    append(entry: T) {
      base.set((prev) => [entry, ...prev].slice(0, max));
    },
    appendMany(entries: T[]) {
      if (entries.length === 0) return;
      base.set((prev) => [...entries, ...prev].slice(0, max));
    },
    prune(predicate: (entry: T) => boolean) {
      base.set((prev) => {
        const next = prev.filter(predicate);
        return next.length === prev.length ? prev : next;
      });
    },
  };
}
