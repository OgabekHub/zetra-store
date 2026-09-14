/**
 * Saqlangan qiymatlar uchun sxema tekshiruvchilari.
 *
 * Har biri `unknown` oladi va yaroqli bo'lsa tiplangan qiymatni, aks holda
 * `null` qaytaradi. Hech biri istisno tashlamaydi.
 */
import {
  isRecord,
  isNonEmptyString,
  isFiniteNumber,
  isPositiveInt,
  isBoolean,
  isDateString,
  oneOf,
  parseArrayOf,
  isSafeObjectKey,
} from '@/utils/guards';
import type {
  Product,
  CartItem,
  CatalogOverlay,
  Currency,
  UserProfile,
  Account,
  Session,
  SecurityLog,
  SecurityKeys,
  Purchase,
  PurchaseLine,
  PasswordHash,
  LoginThrottleEntry,
} from '@/types';

const isCurrencyValue = oneOf(['USD', 'UZS'] as const);
const isThemeValue = oneOf(['light', 'dark'] as const);
const isLanguageValue = oneOf(['uz', 'ru', 'en'] as const);
const isLogStatus = oneOf(['success', 'failed', 'warning'] as const);
const isOrigin = oneOf(['seed', 'local'] as const);

export function parseProduct(raw: unknown): Product | null {
  if (!isRecord(raw)) return null;
  if (!isPositiveInt(raw.id)) return null;
  if (!isNonEmptyString(raw.title)) return null;
  if (!isNonEmptyString(raw.category)) return null;
  if (!isFiniteNumber(raw.price) || raw.price < 0) return null;
  if (!isFiniteNumber(raw.rating)) return null;
  if (!isFiniteNumber(raw.reviews)) return null;
  if (!isNonEmptyString(raw.image)) return null;
  if (!isNonEmptyString(raw.author)) return null;
  if (typeof raw.description !== 'string') return null;
  if (typeof raw.fileSize !== 'string') return null;
  if (typeof raw.fileType !== 'string') return null;
  const features = parseArrayOf(raw.features, (f) => (typeof f === 'string' ? f : null), true);
  if (features === null) return null;

  const product: Product = {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    price: raw.price,
    rating: raw.rating,
    reviews: raw.reviews,
    image: raw.image,
    author: raw.author,
    description: raw.description,
    fileSize: raw.fileSize,
    fileType: raw.fileType,
    features,
  };
  if (isFiniteNumber(raw.originalPrice)) product.originalPrice = raw.originalPrice;
  if (isDateString(raw.createdAt)) product.createdAt = raw.createdAt;
  if (isBoolean(raw.isNew)) product.isNew = raw.isNew;
  if (isOrigin(raw.origin)) product.origin = raw.origin;
  return product;
}

export function parseCartItem(raw: unknown): CartItem | null {
  const product = parseProduct(raw);
  if (!product) return null;
  if (!isRecord(raw) || !isPositiveInt(raw.quantity)) return null;
  return { ...product, quantity: raw.quantity };
}

export function parseCart(raw: unknown): CartItem[] | null {
  return parseArrayOf(raw, parseCartItem, true);
}

export function parseCatalogOverlay(raw: unknown): CatalogOverlay | null {
  if (!isRecord(raw)) return null;
  const custom = parseArrayOf(raw.custom, parseProduct, true);
  const hiddenSeedIds = parseArrayOf(
    raw.hiddenSeedIds,
    (v) => (isPositiveInt(v) ? v : null),
    true,
  );
  if (custom === null || hiddenSeedIds === null) return null;
  return { custom, hiddenSeedIds };
}

export function parseUserProfile(raw: unknown): UserProfile | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (!isNonEmptyString(raw.name)) return null;
  if (!isNonEmptyString(raw.email)) return null;
  return { id: raw.id, name: raw.name, email: raw.email };
}

export function parseAccount(raw: unknown): Account | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (!isNonEmptyString(raw.email)) return null;
  if (!isNonEmptyString(raw.name)) return null;
  if (!isDateString(raw.createdAt)) return null;
  const account: Account = { id: raw.id, email: raw.email, name: raw.name, createdAt: raw.createdAt };
  if (raw.password !== undefined) {
    // Parol yozuvi buzilgan bo'lsa hisob butunlay rad etiladi: uni jimgina
    // parolsiz qilib qo'yish hisobni boshqa odam egallashiga yo'l ochardi.
    const password = parsePasswordHash(raw.password);
    if (!password) return null;
    account.password = password;
  }
  return account;
}

export function parseAccountMap(raw: unknown): Record<string, Account> | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, Account> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isSafeObjectKey(key)) continue;
    const account = parseAccount(value);
    if (account) out[key] = account;
  }
  return out;
}

export function parseSession(raw: unknown): Session | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (!isNonEmptyString(raw.email)) return null;
  if (!isNonEmptyString(raw.device)) return null;
  if (!isNonEmptyString(raw.ip)) return null;
  if (!isDateString(raw.lastActive)) return null;
  return {
    id: raw.id,
    email: raw.email,
    device: raw.device,
    ip: raw.ip,
    lastActive: raw.lastActive,
    isCurrent: raw.isCurrent === true,
  };
}

export function parseSecurityLog(raw: unknown): SecurityLog | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (!isNonEmptyString(raw.email)) return null;
  if (!isNonEmptyString(raw.event)) return null;
  if (!isNonEmptyString(raw.ip)) return null;
  if (!isNonEmptyString(raw.device)) return null;
  if (!isDateString(raw.date)) return null;
  if (!isLogStatus(raw.status)) return null;
  return {
    id: raw.id,
    email: raw.email,
    event: raw.event,
    ip: raw.ip,
    device: raw.device,
    date: raw.date,
    status: raw.status,
  };
}

function parsePurchaseLine(raw: unknown): PurchaseLine | null {
  if (!isRecord(raw)) return null;
  if (!isPositiveInt(raw.productId)) return null;
  if (!isPositiveInt(raw.quantity)) return null;
  if (!isFiniteNumber(raw.unitPrice) || raw.unitPrice < 0) return null;
  const product = parseProduct(raw.product);
  if (!product) return null;
  return { productId: raw.productId, quantity: raw.quantity, unitPrice: raw.unitPrice, product };
}

export function parsePurchase(raw: unknown): Purchase | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (!isNonEmptyString(raw.userId)) return null;
  if (!isFiniteNumber(raw.total) || raw.total < 0) return null;
  if (!isDateString(raw.purchasedAt)) return null;
  const lines = parseArrayOf(raw.lines, parsePurchaseLine, true);
  if (lines === null || lines.length === 0) return null;
  return { id: raw.id, userId: raw.userId, lines, total: raw.total, purchasedAt: raw.purchasedAt };
}

export function parsePurchases(raw: unknown): Purchase[] | null {
  return parseArrayOf(raw, parsePurchase, true);
}

export function parseCurrency(raw: unknown): Currency | null {
  return isCurrencyValue(raw) ? raw : null;
}

export function parseTheme(raw: unknown): 'light' | 'dark' | null {
  return isThemeValue(raw) ? raw : null;
}

export function parseLanguage(raw: unknown): 'uz' | 'ru' | 'en' | null {
  return isLanguageValue(raw) ? raw : null;
}

/**
 * Valyuta kursi chegaralari.
 *
 * Tekshiruv `typeof === 'number'` emas, diapazon bo'lishi kerak: API `"12800"`
 * satrini qaytarsa `*` operatori uni majburan songa aylantiradi va hech narsa
 * sezilmaydi. Muammo faqat butunlay sonsiz qiymat kelganda chiqadi.
 */
export const FX_RATE_MIN = 1_000;
export const FX_RATE_MAX = 1_000_000;

export function parseExchangeRate(raw: unknown): number | null {
  const n = typeof raw === 'string' ? Number(raw) : raw;
  if (!isFiniteNumber(n)) return null;
  if (n < FX_RATE_MIN || n > FX_RATE_MAX) return null;
  return n;
}

export interface CachedFxRate {
  rate: number;
  /** ISO string. */
  fetchedAt: string;
}

export function parseCachedFxRate(raw: unknown): CachedFxRate | null {
  if (!isRecord(raw)) return null;
  const rate = parseExchangeRate(raw.rate);
  if (rate === null) return null;
  if (!isDateString(raw.fetchedAt)) return null;
  return { rate, fetchedAt: raw.fetchedAt };
}

export function parseSecurityKeyMap(raw: unknown): Record<string, SecurityKeys> | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, SecurityKeys> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isSafeObjectKey(key)) continue;
    if (!isRecord(value)) continue;
    if (!isNonEmptyString(value.license) || !isNonEmptyString(value.decrypt)) continue;
    out[key] = { license: value.license, decrypt: value.decrypt };
  }
  return out;
}

export function parseDownloadLimits(raw: unknown): Record<string, number> | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isSafeObjectKey(key)) continue;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) out[key] = value;
  }
  return out;
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function parsePasswordHash(raw: unknown): PasswordHash | null {
  if (!isRecord(raw)) return null;
  if (raw.algorithm !== 'PBKDF2-SHA256') return null;
  if (!isPositiveInt(raw.iterations) || raw.iterations < 1_000 || raw.iterations > 10_000_000) return null;
  if (typeof raw.salt !== 'string' || !BASE64.test(raw.salt)) return null;
  if (typeof raw.hash !== 'string' || !BASE64.test(raw.hash)) return null;
  return { algorithm: 'PBKDF2-SHA256', iterations: raw.iterations, salt: raw.salt, hash: raw.hash };
}

export function parseLoginThrottleMap(raw: unknown): Record<string, LoginThrottleEntry> | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, LoginThrottleEntry> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isSafeObjectKey(key) || !isRecord(value)) continue;
    if (!isPositiveInt(value.failures) || value.failures > 1_000) continue;
    if (!isFiniteNumber(value.firstFailureAt) || value.firstFailureAt < 0) continue;
    let lockedUntil: number | null;
    if (value.lockedUntil === null) lockedUntil = null;
    else if (isFiniteNumber(value.lockedUntil)) lockedUntil = value.lockedUntil;
    else continue;
    out[key] = { failures: value.failures, firstFailureAt: value.firstFailureAt, lockedUntil };
  }
  return out;
}
