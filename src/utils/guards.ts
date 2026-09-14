/**
 * Domendan mustaqil runtime tekshiruvlari.
 *
 * `JSON.parse` `any` qaytaradi, TypeScript esa bunga ishonadi. Shuning uchun
 * saqlangan qiymat o'qilganda uning shakli haqiqatan tekshirilishi kerak —
 * aks holda `zetra-user` da `{"nam":"x"}` bo'lsa, `currentUser.name.charAt(0)`
 * butun daraxtni yiqitadi.
 */

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

/** ISO sana satri (yoki hech bo'lmaganda `Date` tushunadigan satr). */
export function isDateString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && !Number.isNaN(Date.parse(v));
}

export function oneOf<const T extends readonly string[]>(
  allowed: T,
): (v: unknown) => v is T[number] {
  return (v: unknown): v is T[number] =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v);
}

/**
 * Massivni element-element tekshiradi.
 * `dropInvalid` true bo'lsa, yaroqsiz elementlar tashlanadi va qolganlari qaytadi;
 * false bo'lsa, bitta yaroqsiz element butun massivni rad etadi.
 */
export function parseArrayOf<T>(
  v: unknown,
  parseItem: (raw: unknown) => T | null,
  dropInvalid = false,
): T[] | null {
  if (!Array.isArray(v)) return null;
  const out: T[] = [];
  for (const item of v) {
    const parsed = parseItem(item);
    if (parsed === null) {
      if (!dropInvalid) return null;
      continue;
    }
    out.push(parsed);
  }
  return out;
}

const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Obyekt kaliti sifatida ishlatish xavfsizmi.
 *
 * `JSON.parse('{"__proto__": {...}}')` `__proto__` ni oddiy xususiyat qilib
 * yaratadi. Uni `out[key] = value` bilan boshqa obyektga ko'chirsangiz, o'sha
 * obyektning prototipi almashadi. `localStorage` ni istalgan skript yoki
 * kengaytma o'zgartira olgani uchun, xaritaga aylantiriladigan har bir
 * saqlangan qiymat shu tekshiruvdan o'tishi kerak.
 */
export function isSafeObjectKey(key: string): boolean {
  return !UNSAFE_OBJECT_KEYS.has(key);
}

/** Ixtiyoriy maydon: yo'q bo'lsa ham yaroqli, bor bo'lsa tekshiriladi. */
export function optional<T>(v: unknown, check: (x: unknown) => x is T): v is T | undefined {
  return v === undefined || check(v);
}
