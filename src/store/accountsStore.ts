/**
 * Hisoblar reyestri: normallashtirilgan email → `Account`.
 *
 * Nima uchun kerak:
 *  - Yuklab olish chegarasi va litsenziya kalitlari avval foydalanuvchining
 *    **o'zgaruvchan** email'iga bog'langan edi. Endi barqaror `id` bor.
 *  - Parol avval umuman tekshirilmasdi. Endi PBKDF2 xeshi saqlanadi
 *    (`@/lib/password`), ochiq parol hech qayerda yozilmaydi.
 *
 * DIQQAT: bu klient tomonidagi demo — haqiqiy autentifikatsiya serverda
 * bo'lishi shart.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS } from './keys';
import { parseAccountMap } from '@/schemas';
import {
  DEFAULT_PBKDF2_ITERATIONS,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '@/lib/password';
import type { Account, PasswordHash } from '@/types';

const EMPTY: Record<string, Account> = {};

export const accountsStore = createPersistentStore<Record<string, Account>>({
  key: STORAGE_KEYS.accounts,
  version: STORAGE_VERSIONS[STORAGE_KEYS.accounts],
  fallback: () => EMPTY,
  validate: parseAccountMap,
});

export interface CredentialOptions {
  /** PBKDF2 iteratsiyalari. Faqat testlarda kamaytiriladi. */
  iterations?: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function findAccountByEmail(email: string): Account | undefined {
  return accountsStore.getSnapshot()[normalizeEmail(email)];
}

function findEntryById(accountId: string): [string, Account] | undefined {
  return Object.entries(accountsStore.getSnapshot()).find(([, account]) => account.id === accountId);
}

/**
 * Email bo'yicha hisobni topadi, yo'q bo'lsa parolsiz yaratadi (ijtimoiy
 * kirish va eski ma'lumotlar migratsiyasi uchun). Ism yangilanadi, `id` va
 * parol o'zgarmaydi.
 */
export function resolveAccount(email: string, name: string): Account {
  const key = normalizeEmail(email);
  const existing = accountsStore.getSnapshot()[key];

  if (existing) {
    if (existing.name !== name || existing.email !== email) {
      const updated: Account = { ...existing, name, email };
      accountsStore.set((prev) => ({ ...prev, [key]: updated }));
      return updated;
    }
    return existing;
  }

  const account: Account = { id: createId(), email, name, createdAt: new Date().toISOString() };
  accountsStore.set((prev) => ({ ...prev, [key]: account }));
  return account;
}

export type RekeyResult = { ok: true; account: Account } | { ok: false; reason: 'email-taken' };

/**
 * Email o'zgarganda reyestr kalitini ko'chiradi.
 *
 * Ikki xato tuzatilgan:
 *  - avval yangi obyekt `{ id, email, name, createdAt }` dan qurilardi va parol
 *    yo'qolib ketardi;
 *  - boshqa hisobga tegishli email tanlansa, o'sha hisob jimgina ustidan
 *    yozilardi — foydalanuvchi boshqa odamning hisobini o'chirib, uning
 *    email'ini egallab olardi.
 */
export function rekeyAccount(accountId: string, nextEmail: string, nextName: string): RekeyResult {
  const nextKey = normalizeEmail(nextEmail);
  const occupant = accountsStore.getSnapshot()[nextKey];
  if (occupant && occupant.id !== accountId) return { ok: false, reason: 'email-taken' };

  const current = findEntryById(accountId);
  const account: Account = current
    ? { ...current[1], email: nextEmail, name: nextName }
    : { id: accountId, email: nextEmail, name: nextName, createdAt: new Date().toISOString() };

  accountsStore.set((prev) => {
    const next = { ...prev };
    if (current) delete next[current[0]];
    next[nextKey] = account;
    return next;
  });

  return { ok: true, account };
}

export type RegistrationResult = { ok: true; account: Account } | { ok: false; reason: 'email-taken' };

/**
 * Oldindan hisoblangan xesh bilan hisobni yozadi.
 * Parolsiz mavjud hisob (ijtimoiy kirish) bo'lsa, unga parol biriktiriladi va
 * `id` saqlanadi.
 */
export function commitRegistration(
  name: string,
  email: string,
  passwordHash: PasswordHash,
): RegistrationResult {
  const key = normalizeEmail(email);
  const existing = accountsStore.getSnapshot()[key];
  if (existing?.password) return { ok: false, reason: 'email-taken' };

  const account: Account = existing
    ? { ...existing, name, email, password: passwordHash }
    : { id: createId(), email, name, createdAt: new Date().toISOString(), password: passwordHash };

  accountsStore.set((prev) => ({ ...prev, [key]: account }));
  return { ok: true, account };
}

export async function registerAccount(
  name: string,
  email: string,
  password: string,
  options: CredentialOptions = {},
): Promise<RegistrationResult> {
  if (findAccountByEmail(email)?.password) return { ok: false, reason: 'email-taken' };
  const passwordHash = await hashPassword(password, options.iterations);
  // Xeshlash davomida boshqa tab shu email bilan ro'yxatdan o'tgan bo'lishi
  // mumkin — `commitRegistration` buni qayta tekshiradi.
  return commitRegistration(name, email, passwordHash);
}

function setPasswordHash(accountId: string, passwordHash: PasswordHash): void {
  accountsStore.set((prev) => {
    const entry = Object.entries(prev).find(([, account]) => account.id === accountId);
    if (!entry) return prev;
    return { ...prev, [entry[0]]: { ...entry[1], password: passwordHash } };
  });
}

const dummyHashes = new Map<number, Promise<PasswordHash>>();

function dummyHashFor(iterations: number): Promise<PasswordHash> {
  let hash = dummyHashes.get(iterations);
  if (!hash) {
    hash = hashPassword('zetra-dummy-password', iterations);
    dummyHashes.set(iterations, hash);
  }
  return hash;
}

export type VerifyCredentialsResult = { ok: true; account: Account } | { ok: false; reason: 'invalid' };

/**
 * Email va parolni tekshiradi.
 *
 * Hisob yo'q, parolsiz yoki parol noto'g'ri bo'lsa — javob bir xil. Hisob
 * topilmaganda ham soxta xesh hisoblanadi, shunda javob vaqtidan email
 * ro'yxatdan o'tganini bilib bo'lmaydi.
 */
export async function verifyCredentials(
  email: string,
  password: string,
  options: CredentialOptions = {},
): Promise<VerifyCredentialsResult> {
  const iterations = options.iterations ?? DEFAULT_PBKDF2_ITERATIONS;
  const account = findAccountByEmail(email);

  if (!account?.password) {
    await verifyPassword(password, await dummyHashFor(iterations));
    return { ok: false, reason: 'invalid' };
  }

  if (!(await verifyPassword(password, account.password))) {
    return { ok: false, reason: 'invalid' };
  }

  // Eski, kuchsizroq xesh kirish paytida yangilanadi.
  if (needsRehash(account.password, iterations)) {
    setPasswordHash(account.id, await hashPassword(password, iterations));
  }

  return { ok: true, account: findEntryById(account.id)?.[1] ?? account };
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'invalid-current' };

/**
 * Parolni o'zgartiradi. Hisobda parol bo'lsa, joriy parol talab qilinadi —
 * aks holda qarovsiz qolgan ochiq sessiyadan parolni almashtirish mumkin
 * bo'lardi.
 */
export async function changePassword(
  accountId: string,
  currentPassword: string,
  newPassword: string,
  options: CredentialOptions = {},
): Promise<ChangePasswordResult> {
  const entry = findEntryById(accountId);
  if (!entry) return { ok: false, reason: 'not-found' };

  const [, account] = entry;
  if (account.password && !(await verifyPassword(currentPassword, account.password))) {
    return { ok: false, reason: 'invalid-current' };
  }

  setPasswordHash(accountId, await hashPassword(newPassword, options.iterations));
  return { ok: true };
}
