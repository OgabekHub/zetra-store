/**
 * Parol xeshlash (PBKDF2-HMAC-SHA256, WebCrypto).
 *
 * Avval parol umuman tekshirilmasdi: istalgan email + 6 belgi + ekranda
 * yozilgan "1998" kodi o'sha email hisobiga kirish imkonini berardi.
 *
 * DIQQAT: bu klient tomonidagi demo. Haqiqiy tizimda xeshlash va tekshirish
 * serverda bo'lishi shart — brauzerdagi `localStorage` ni istalgan skript
 * o'qiy va o'zgartira oladi. Lekin oqim to'g'ri modellashtirilgan: ochiq parol
 * hech qayerda saqlanmaydi, har bir parolga alohida tuz beriladi va taqqoslash
 * doimiy vaqtda bajariladi.
 */
import type { PasswordHash } from '@/types';

export const PASSWORD_HASH_ALGORITHM = 'PBKDF2-SHA256' as const;

/** OWASP (2023) PBKDF2-HMAC-SHA256 uchun tavsiya etgan eng kam iteratsiya. */
export const DEFAULT_PBKDF2_ITERATIONS = 600_000;

const SALT_BYTES = 16;
const HASH_BITS = 256;

function subtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto (crypto.subtle) mavjud emas — parolni xavfsiz xeshlab bo\'lmaydi');
  }
  return subtle;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  const subtle = subtleCrypto();
  // NFKC: bir xil ko'rinadigan, lekin turlicha kodlangan belgilar (masalan,
  // "é" ning ikki shakli) bir xil parol deb qabul qilinadi.
  const material = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(
  password: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
): Promise<PasswordHash> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveKey(password, salt, iterations);
  return {
    algorithm: PASSWORD_HASH_ALGORITHM,
    iterations,
    salt: toBase64(salt),
    hash: toBase64(hash),
  };
}

/**
 * Doimiy vaqtli taqqoslash: javob vaqti qaysi bayt birinchi farq qilganiga
 * bog'liq bo'lmaydi.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  if (stored.algorithm !== PASSWORD_HASH_ALGORITHM) return false;
  const salt = fromBase64(stored.salt);
  const expected = fromBase64(stored.hash);
  if (!salt || !expected || expected.length === 0) return false;

  const actual = await deriveKey(password, salt, stored.iterations);
  return timingSafeEqual(actual, expected);
}

/** Saqlangan xesh joriy talabdan kuchsizmi — kirishda qayta xeshlash kerakmi. */
export function needsRehash(
  stored: PasswordHash,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
): boolean {
  return stored.algorithm !== PASSWORD_HASH_ALGORITHM || stored.iterations < iterations;
}
