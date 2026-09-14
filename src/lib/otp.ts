/**
 * Bir martalik tasdiqlash kodi (OTP).
 *
 * Avval kod barcha foydalanuvchilar uchun qat'iy "1998" edi, ekranda va tostda
 * ochiq yozilardi, muddati ham, urinishlar chegarasi ham yo'q edi.
 *
 * Endi:
 *  - kod kriptografik tasodifiy (`crypto.getRandomValues`);
 *  - 5 daqiqadan keyin eskiradi;
 *  - 5 ta noto'g'ri urinishdan keyin bekor bo'ladi;
 *  - to'g'ri kiritilgach qayta ishlatib bo'lmaydi;
 *  - qayta yuborish 60 soniyada bir martadan ko'p emas.
 *
 * DIQQAT: SMS provayder yo'qligi sababli demo rejimda kod foydalanuvchiga ochiq
 * ko'rsatiladi. Kod faqat komponent xotirasida turadi, `localStorage` ga
 * yozilmaydi.
 */

export const OTP_LENGTH = 4;
export const OTP_TTL_MS = 5 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60_000;

export interface OtpChallenge {
  readonly code: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly attemptsLeft: number;
}

export type OtpFailure = 'malformed' | 'expired' | 'locked' | 'mismatch';

export type OtpResult = { ok: true } | { ok: false; reason: OtpFailure; attemptsLeft: number };

export type RandomBytes = (buffer: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;

const secureRandomBytes: RandomBytes = (buffer) => globalThis.crypto.getRandomValues(buffer);

/**
 * Tasodifiy raqamli kod.
 * 250–255 baytlar tashlanadi (rejection sampling): aks holda `% 10` tufayli
 * 0–5 raqamlari boshqalardan biroz tez-tez chiqardi.
 */
export function generateOtpCode(
  length: number = OTP_LENGTH,
  randomBytes: RandomBytes = secureRandomBytes,
): string {
  const buffer = new Uint8Array(1);
  let code = '';
  while (code.length < length) {
    randomBytes(buffer);
    if (buffer[0] >= 250) continue;
    code += String(buffer[0] % 10);
  }
  return code;
}

export function createOtpChallenge(
  now: number = Date.now(),
  randomBytes: RandomBytes = secureRandomBytes,
): OtpChallenge {
  return {
    code: generateOtpCode(OTP_LENGTH, randomBytes),
    issuedAt: now,
    expiresAt: now + OTP_TTL_MS,
    attemptsLeft: OTP_MAX_ATTEMPTS,
  };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

/**
 * Kiritilgan kodni tekshiradi va yangilangan challenge'ni qaytaradi.
 * Noto'g'ri formatdagi kiritish (masalan, 3 ta raqam) urinish hisoblanmaydi.
 */
export function verifyOtp(
  challenge: OtpChallenge,
  input: string,
  now: number = Date.now(),
): { result: OtpResult; challenge: OtpChallenge } {
  if (challenge.attemptsLeft <= 0) {
    return { result: { ok: false, reason: 'locked', attemptsLeft: 0 }, challenge };
  }
  if (now > challenge.expiresAt) {
    return { result: { ok: false, reason: 'expired', attemptsLeft: challenge.attemptsLeft }, challenge };
  }

  const code = input.trim();
  const wellFormed = code.length === OTP_LENGTH && [...code].every((ch) => ch >= '0' && ch <= '9');
  if (!wellFormed) {
    return { result: { ok: false, reason: 'malformed', attemptsLeft: challenge.attemptsLeft }, challenge };
  }

  if (constantTimeEqual(code, challenge.code)) {
    // Bir martalik: muvaffaqiyatdan keyin shu kod bilan qayta kirib bo'lmaydi.
    return { result: { ok: true }, challenge: { ...challenge, attemptsLeft: 0 } };
  }

  const attemptsLeft = challenge.attemptsLeft - 1;
  return {
    result: { ok: false, reason: attemptsLeft === 0 ? 'locked' : 'mismatch', attemptsLeft },
    challenge: { ...challenge, attemptsLeft },
  };
}

export function canResendOtp(challenge: OtpChallenge | null, now: number = Date.now()): boolean {
  return challenge === null || now - challenge.issuedAt >= OTP_RESEND_COOLDOWN_MS;
}
