// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  canResendOtp,
  createOtpChallenge,
  generateOtpCode,
  verifyOtp,
  type RandomBytes,
} from './otp';

const NOW = 1_700_000_000_000;

describe('generateOtpCode', () => {
  it('belgilangan uzunlikdagi raqamli kod beradi', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtpCode()).toMatch(new RegExp(`^[0-9]{${OTP_LENGTH}}$`));
    }
  });

  // Regressiya: avval kod barcha foydalanuvchilar uchun qat'iy "1998" edi.
  it('kodlar tasodifiy va barcha raqamlar uchraydi', () => {
    const codes = new Set<string>();
    const digits = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const code = generateOtpCode();
      codes.add(code);
      for (const digit of code) digits.add(digit);
    }
    expect(codes.size).toBeGreaterThan(250);
    expect(digits.size).toBe(10);
  });

  it('250 va undan katta baytlarni tashlaydi (teng taqsimot)', () => {
    const sequence = [255, 250, 3, 7];
    let index = 0;
    const random: RandomBytes = (buffer) => {
      buffer[0] = sequence[index++];
      return buffer;
    };
    expect(generateOtpCode(2, random)).toBe('37');
  });
});

describe('verifyOtp', () => {
  const fixed: RandomBytes = (buffer) => {
    buffer[0] = 4;
    return buffer;
  };

  it('to\'g\'ri kodni qabul qiladi va uni qayta ishlatib bo\'lmaydi', () => {
    const challenge = createOtpChallenge(NOW, fixed);
    expect(challenge.code).toBe('4'.repeat(OTP_LENGTH));

    const first = verifyOtp(challenge, challenge.code, NOW + 1_000);
    expect(first.result).toEqual({ ok: true });

    const reuse = verifyOtp(first.challenge, challenge.code, NOW + 2_000);
    expect(reuse.result).toEqual({ ok: false, reason: 'locked', attemptsLeft: 0 });
  });

  it('noto\'g\'ri kod urinishni kamaytiradi va oxirida bloklaydi', () => {
    let challenge = createOtpChallenge(NOW, fixed);
    for (let i = 1; i < OTP_MAX_ATTEMPTS; i++) {
      const step = verifyOtp(challenge, '0000', NOW);
      expect(step.result).toEqual({ ok: false, reason: 'mismatch', attemptsLeft: OTP_MAX_ATTEMPTS - i });
      challenge = step.challenge;
    }
    const last = verifyOtp(challenge, '0000', NOW);
    expect(last.result).toEqual({ ok: false, reason: 'locked', attemptsLeft: 0 });

    // Bloklangach to'g'ri kod ham qabul qilinmaydi.
    expect(verifyOtp(last.challenge, '4444', NOW).result).toEqual({ ok: false, reason: 'locked', attemptsLeft: 0 });
  });

  it('muddati o\'tgan kodni rad etadi', () => {
    const challenge = createOtpChallenge(NOW, fixed);
    expect(verifyOtp(challenge, '4444', NOW + OTP_TTL_MS + 1).result).toEqual({
      ok: false,
      reason: 'expired',
      attemptsLeft: OTP_MAX_ATTEMPTS,
    });
  });

  it('noto\'g\'ri formatdagi kiritish urinish hisoblanmaydi', () => {
    const challenge = createOtpChallenge(NOW, fixed);
    for (const input of ['', '123', '12345', 'abcd', '12a4']) {
      const step = verifyOtp(challenge, input, NOW);
      expect(step.result).toEqual({ ok: false, reason: 'malformed', attemptsLeft: OTP_MAX_ATTEMPTS });
      expect(step.challenge.attemptsLeft).toBe(OTP_MAX_ATTEMPTS);
    }
  });
});

describe('canResendOtp', () => {
  it('kutish vaqti tugamaguncha qayta yuborishga ruxsat bermaydi', () => {
    const challenge = createOtpChallenge(NOW);
    expect(canResendOtp(challenge, NOW + OTP_RESEND_COOLDOWN_MS - 1)).toBe(false);
    expect(canResendOtp(challenge, NOW + OTP_RESEND_COOLDOWN_MS)).toBe(true);
    expect(canResendOtp(null, NOW)).toBe(true);
  });
});
