/**
 * Faol seanslar va xavfsizlik jurnali.
 *
 * Ikkalasi ham chegaralangan: avval har login, har noto'g'ri OTP, har qayta
 * yuborish va har modal ochilishida bitta qator qo'shilardi, hech qanday
 * chegara yoki tozalashsiz.
 */
import { createCappedLogStore } from './createCappedLogStore';
import { STORAGE_KEYS, STORAGE_VERSIONS, LOG_CAPS } from './keys';
import { parseSession, parseSecurityLog } from '@/schemas';
import { getMockIP, getDeviceLabel, createRecordId } from '@/utils/deviceInfo';
import type { Session, SecurityLog, SecurityLogStatus } from '@/types';

export const sessionsStore = createCappedLogStore<Session>({
  key: STORAGE_KEYS.sessions,
  version: STORAGE_VERSIONS[STORAGE_KEYS.sessions],
  max: LOG_CAPS.sessions,
  validateEntry: parseSession,
});

export const securityLogsStore = createCappedLogStore<SecurityLog>({
  key: STORAGE_KEYS.securityLogs,
  version: STORAGE_VERSIONS[STORAGE_KEYS.securityLogs],
  max: LOG_CAPS.securityLogs,
  validateEntry: parseSecurityLog,
});

export function logSecurityEvent(
  email: string,
  event: string,
  status: SecurityLogStatus = 'success',
): SecurityLog {
  const entry: SecurityLog = {
    id: createRecordId('LOG'),
    email,
    event,
    ip: getMockIP(),
    device: getDeviceLabel(),
    date: new Date().toISOString(),
    status,
  };
  securityLogsStore.append(entry);
  return entry;
}

/**
 * Shu foydalanuvchi uchun yangi joriy seans yaratadi.
 *
 * Avval bu funksiya **barcha** seanslarni, jumladan boshqa email'larnikini
 * ham `isCurrent: false` qilardi va foydalanuvchining oldingi joriy seansini
 * demote qilish o'rniga butunlay o'chirardi.
 */
export function createSession(email: string): Session {
  const session: Session = {
    id: createRecordId('SES'),
    email,
    device: getDeviceLabel(),
    ip: getMockIP(),
    lastActive: new Date().toISOString(),
    isCurrent: true,
  };

  sessionsStore.set((prev) => {
    const next = prev.map((s) => (s.email === email ? { ...s, isCurrent: false } : s));
    return [session, ...next].slice(0, LOG_CAPS.sessions);
  });

  return session;
}

export function sessionsFor(all: Session[], email: string | undefined): Session[] {
  if (!email) return [];
  return all.filter((s) => s.email === email);
}

export function logsFor(all: SecurityLog[], email: string | undefined): SecurityLog[] {
  if (!email) return [];
  return all.filter((l) => l.email === email);
}

/** Shu foydalanuvchining joriy bo'lmagan seanslarini tugatadi. Boshqalarniki tegilmaydi. */
export function revokeOtherSessions(email: string): void {
  sessionsStore.set((prev) => prev.filter((s) => s.email !== email || s.isCurrent));
}

/**
 * Email o'zgarganda seans va jurnal yozuvlarini yangi email'ga ko'chiradi.
 * Ular email bo'yicha filtrlanadi; ko'chirilmasa, email o'zgargach profildagi
 * xavfsizlik tarixi yo'qolib qolardi.
 */
export function renameEmailInSecurityRecords(previousEmail: string, nextEmail: string): void {
  if (previousEmail === nextEmail) return;

  sessionsStore.set((prev) => {
    let changed = false;
    const next = prev.map((session) => {
      if (session.email !== previousEmail) return session;
      changed = true;
      return { ...session, email: nextEmail };
    });
    return changed ? next : prev;
  });

  securityLogsStore.set((prev) => {
    let changed = false;
    const next = prev.map((log) => {
      if (log.email !== previousEmail) return log;
      changed = true;
      return { ...log, email: nextEmail };
    });
    return changed ? next : prev;
  });
}
