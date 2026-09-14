// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PBKDF2_ITERATIONS,
  hashPassword,
  needsRehash,
  timingSafeEqual,
  verifyPassword,
} from './password';

// Testlarda tezlik uchun kam iteratsiya; production qiymati alohida tekshiriladi.
const FAST = 1_000;

describe('hashPassword', () => {
  it('ochiq parolni saqlamaydi va har safar yangi tuz ishlatadi', async () => {
    const first = await hashPassword('Maxfiy-parol-2026', FAST);
    const second = await hashPassword('Maxfiy-parol-2026', FAST);

    expect(first.algorithm).toBe('PBKDF2-SHA256');
    expect(first.iterations).toBe(FAST);
    expect(JSON.stringify(first)).not.toContain('Maxfiy-parol-2026');
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });

  it('standart iteratsiya soni OWASP tavsiyasidan kam emas', () => {
    expect(DEFAULT_PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });
});

describe('verifyPassword', () => {
  it('to\'g\'ri parolni tasdiqlaydi, noto\'g\'risini rad etadi', async () => {
    const stored = await hashPassword('To\'g\'ri-parol-1', FAST);
    expect(await verifyPassword('To\'g\'ri-parol-1', stored)).toBe(true);
    expect(await verifyPassword('to\'g\'ri-parol-1', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('bir xil ko\'rinadigan Unicode shakllarini bir xil parol deb biladi', async () => {
    const stored = await hashPassword('café-parol', FAST);
    expect(await verifyPassword('café-parol', stored)).toBe(true);
  });

  it('buzilgan yoki o\'zgartirilgan yozuvda false qaytaradi', async () => {
    const stored = await hashPassword('parol-12345', FAST);
    expect(await verifyPassword('parol-12345', { ...stored, salt: '%%%' })).toBe(false);
    expect(await verifyPassword('parol-12345', { ...stored, hash: '' })).toBe(false);
    expect(await verifyPassword('parol-12345', { ...stored, iterations: FAST + 1 })).toBe(false);
    expect(
      await verifyPassword('parol-12345', { ...stored, algorithm: 'MD5' as unknown as 'PBKDF2-SHA256' }),
    ).toBe(false);
  });
});

describe('timingSafeEqual', () => {
  it('uzunlik va mazmunni solishtiradi', () => {
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });
});

describe('needsRehash', () => {
  it('kuchsizroq xeshni aniqlaydi', async () => {
    const stored = await hashPassword('parol-12345', FAST);
    expect(needsRehash(stored, FAST)).toBe(false);
    expect(needsRehash(stored, FAST * 2)).toBe(true);
    expect(needsRehash(stored)).toBe(true);
  });
});
