/**
 * Kirish urinishlarini cheklash.
 *
 * Avval parol umuman tekshirilmagani uchun bu masala ham yo'q edi. Parol
 * tekshiruvi qo'shilgach, cheksiz taxmin qilishni to'xtatish kerak: 15 daqiqa
 * ichida 5 ta muvaffaqiyatsiz urinishdan keyin shu email uchun kirish 15
 * daqiqaga bloklanadi.
 *
 * DIQQAT: klient tomonidagi cheklov faqat oqimni modellashtiradi. Haqiqiy
 * himoya serverda bo'lishi shart, chunki `localStorage` ni tozalash mumkin.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS } from './keys';
import { normalizeEmail } from './accountsStore';
import { parseLoginThrottleMap } from '@/schemas';
import type { LoginThrottleEntry } from '@/types';

export const MAX_FAILED_ATTEMPTS = 5;
export const FAILURE_WINDOW_MS = 15 * 60_000;
export const LOCKOUT_MS = 15 * 60_000;

export type LoginStatus = { allowed: true } | { allowed: false; retryAfterMs: number };

export interface FailureOutcome {
  failures: number;
  locked: boolean;
  retryAfterMs: number;
}

const EMPTY: Record<string, LoginThrottleEntry> = {};

export const loginThrottleStore = createPersistentStore<Record<string, LoginThrottleEntry>>({
  key: STORAGE_KEYS.authThrottle,
  version: STORAGE_VERSIONS[STORAGE_KEYS.authThrottle],
  fallback: () => EMPTY,
  validate: parseLoginThrottleMap,
});

/** Sof funksiya: yozuv bo'yicha hozir kirishga ruxsat bormi. */
export function evaluateThrottle(entry: LoginThrottleEntry | undefined, now: number): LoginStatus {
  if (!entry || entry.lockedUntil === null || entry.lockedUntil <= now) return { allowed: true };
  return { allowed: false, retryAfterMs: entry.lockedUntil - now };
}

/** Sof funksiya: muvaffaqiyatsiz urinishdan keyingi yozuv. */
export function applyFailure(entry: LoginThrottleEntry | undefined, now: number): LoginThrottleEntry {
  let base: LoginThrottleEntry;
  const lockExpired = entry !== undefined && entry.lockedUntil !== null && entry.lockedUntil <= now;
  const windowExpired = entry !== undefined && now - entry.firstFailureAt > FAILURE_WINDOW_MS;
  if (entry === undefined || lockExpired || windowExpired) {
    base = { failures: 0, firstFailureAt: now, lockedUntil: null };
  } else {
    base = entry;
  }

  const failures = base.failures + 1;
  return {
    failures,
    firstFailureAt: base.firstFailureAt,
    lockedUntil: failures >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : null,
  };
}

/** Eskirgan yozuvlar olib tashlanadi, shunda xarita cheksiz o'smaydi. */
function pruneStale(
  map: Record<string, LoginThrottleEntry>,
  now: number,
): Record<string, LoginThrottleEntry> {
  const next: Record<string, LoginThrottleEntry> = {};
  for (const [key, entry] of Object.entries(map)) {
    const locked = entry.lockedUntil !== null && entry.lockedUntil > now;
    const recent = now - entry.firstFailureAt <= FAILURE_WINDOW_MS;
    if (locked || recent) next[key] = entry;
  }
  return next;
}

export function getLoginStatus(email: string, now: number = Date.now()): LoginStatus {
  return evaluateThrottle(loginThrottleStore.getSnapshot()[normalizeEmail(email)], now);
}

export function recordLoginFailure(email: string, now: number = Date.now()): FailureOutcome {
  const key = normalizeEmail(email);
  const next = applyFailure(loginThrottleStore.getSnapshot()[key], now);
  loginThrottleStore.set((prev) => ({ ...pruneStale(prev, now), [key]: next }));

  const retryAfterMs = next.lockedUntil !== null && next.lockedUntil > now ? next.lockedUntil - now : 0;
  return { failures: next.failures, locked: retryAfterMs > 0, retryAfterMs };
}

export function recordLoginSuccess(email: string): void {
  const key = normalizeEmail(email);
  loginThrottleStore.set((prev) => {
    if (!(key in prev)) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}
