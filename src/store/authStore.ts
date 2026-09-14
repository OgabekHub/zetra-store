/**
 * Joriy foydalanuvchi.
 *
 * Saqlanadigan qiymat `{ user: UserProfile | null }` shaklida — chunki
 * `validate` da `null` "yaroqsiz" degani, va "tizimga kirilmagan" holati ham
 * `null`. Obyekt o'rami bu ikki ma'noni ajratadi.
 *
 * Sxema tekshiruvi tufayli `zetra-user` da buzilgan obyekt bo'lsa ham
 * `currentUser.name.charAt(0)` endi yiqilmaydi.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS } from './keys';
import { parseUserProfile } from '@/schemas';
import { resolveAccount, rekeyAccount } from './accountsStore';
import { renameEmailInSecurityRecords } from './securityStore';
import { isRecord, isNonEmptyString } from '@/utils/guards';
import type { UserProfile } from '@/types';

interface AuthState {
  user: UserProfile | null;
}

const LOGGED_OUT: AuthState = { user: null };

export const authStore = createPersistentStore<AuthState>({
  key: STORAGE_KEYS.user,
  version: STORAGE_VERSIONS[STORAGE_KEYS.user],
  fallback: () => LOGGED_OUT,
  validate: (raw) => {
    if (!isRecord(raw)) return null;
    if (raw.user === null) return LOGGED_OUT;
    const user = parseUserProfile(raw.user);
    return user === null ? null : { user };
  },
  /**
   * v1 da to'g'ridan-to'g'ri `{ name, email }` saqlanardi — barqaror `id` yo'q
   * edi. Migratsiya o'sha email uchun hisob yaratadi va `id` ni biriktiradi,
   * shunda eski foydalanuvchi tizimdan chiqib ketmaydi.
   */
  migrate: (_from, data) => {
    if (!isRecord(data)) return LOGGED_OUT;
    if (!isNonEmptyString(data.name) || !isNonEmptyString(data.email)) return LOGGED_OUT;
    const account = resolveAccount(data.email, data.name);
    return { user: { id: account.id, name: account.name, email: account.email } };
  },
});

export function getCurrentUser(): UserProfile | null {
  return authStore.getSnapshot().user;
}

/**
 * Sessiyani ochadi. Chaqiruvchi hisobni oldin tekshirgan bo'lishi kerak
 * (`verifyCredentials`, `commitRegistration` yoki ijtimoiy kirish).
 */
export function login(name: string, email: string): UserProfile {
  const account = resolveAccount(email, name);
  const profile: UserProfile = { id: account.id, name: account.name, email: account.email };
  authStore.set({ user: profile });
  return profile;
}

export function logout(): void {
  authStore.set(LOGGED_OUT);
}

export type UpdateProfileResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; reason: 'logged-out' | 'email-taken' };

/**
 * Profilni yangilaydi. Email o'zgarsa ham `id` saqlanadi, shuning uchun yuklab
 * olish chegarasi va litsenziya kalitlari joyida qoladi. Boshqa hisobga
 * tegishli email rad etiladi.
 */
export function updateProfile(name: string, email: string): UpdateProfileResult {
  const current = authStore.getSnapshot().user;
  if (!current) return { ok: false, reason: 'logged-out' };

  const result = rekeyAccount(current.id, email, name);
  if (!result.ok) return result;

  if (current.email !== result.account.email) {
    // Seans va xavfsizlik jurnali email bo'yicha filtrlanadi; ko'chirilmasa ular
    // email o'zgargach profildan yo'qolib qolardi.
    renameEmailInSecurityRecords(current.email, result.account.email);
  }

  const profile: UserProfile = {
    id: result.account.id,
    name: result.account.name,
    email: result.account.email,
  };
  authStore.set({ user: profile });
  return { ok: true, profile };
}
