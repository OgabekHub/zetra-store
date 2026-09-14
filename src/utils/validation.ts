/**
 * Forma tekshiruvlari.
 *
 * Avval butun loyihada birorta email regex'i, Luhn tekshiruvi yoki telefon
 * formati tekshiruvi yo'q edi:
 *  - `0000 0000 0000 0000` karta raqami qabul qilinardi;
 *  - `99/99` va `13/24` amal muddati sifatida o'tardi;
 *  - `"abcdefghi"` telefon raqami sifatida o'tib, "muvaffaqiyatli" to'lovga
 *    olib borardi;
 *  - email uchun faqat brauzerning `type="email"` i ishlardi, ya'ni `a@b`
 *    ham yaroqli sanalardi.
 */

/** Oddiy, lekin amaliy email tekshiruvi. */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email);
}

/**
 * Parol uzunligi chegaralari.
 * Eng kami 6 dan 8 ga oshirildi (NIST SP 800-63B). Eng ko'pi esa juda uzun
 * satrni PBKDF2 bilan xeshlab brauzerni qotirishning oldini oladi.
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH && value.length <= MAX_PASSWORD_LENGTH;
}

/** Faqat raqamlarni qoldiradi. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Luhn algoritmi bo'yicha karta raqami nazorat yig'indisi.
 * Bu tekshiruv `0000 0000 0000 0000` kabi raqamlarni rad etadi.
 */
export function luhnCheck(cardNumber: string): boolean {
  const digits = digitsOnly(cardNumber);
  if (digits.length < 13 || digits.length > 19) return false;
  if (/^0+$/.test(digits)) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Karta raqamini 4 talik guruhlarga ajratadi. */
export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Amal muddatini `MM/YY` shaklida formatlaydi.
 *
 * DIQQAT: bu funksiya "o'chirish" holatini alohida ko'radi. Avvalgi
 * amalga oshirishda `"12/"` ko'rsatilganda backspace bosilsa qiymat yana
 * `"12/"` ga qaytardi va foydalanuvchi xato yozilgan oyni hech qachon
 * o'chira olmasdi.
 */
export function formatCardExpiry(nextValue: string, previousValue: string): string {
  const digits = digitsOnly(nextValue).slice(0, 4);
  const removing = nextValue.length < previousValue.length;

  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    // Ikki raqamdan keyin slash faqat foydalanuvchi yozayotganda qo'shiladi.
    return removing ? digits : digits.length === 2 ? `${digits}/` : digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** `MM/YY` haqiqiy va o'tmishda emasligini tekshiradi. */
export function isValidCardExpiry(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  // Karta amal muddati oyning oxirigacha amal qiladi.
  const expiry = new Date(year, month, 1);
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  if (expiry <= current) return false;

  // 20 yildan uzoq muddat haqiqatga to'g'ri kelmaydi.
  return year <= now.getFullYear() + 20;
}

export function isValidCvv(value: string): boolean {
  return /^\d{3,4}$/.test(value.trim());
}

/** O'zbekiston mobil operatorlari kodlari. */
export const UZ_OPERATOR_CODES = [
  '20', '33', '50', '55', '77', '88', '90', '91', '93', '94', '95', '97', '98', '99',
];

/**
 * O'zbekiston telefon raqamini tekshiradi.
 * `+998 90 123 45 67`, `998901234567` va `901234567` shakllari qabul qilinadi.
 */
export function isValidUzPhone(value: string): boolean {
  let digits = digitsOnly(value);
  if (digits.startsWith('998')) digits = digits.slice(3);
  if (digits.length !== 9) return false;
  return UZ_OPERATOR_CODES.includes(digits.slice(0, 2));
}

/** Telefon raqamini `90 123 45 67` ko'rinishida formatlaydi. */
export function formatUzPhone(value: string): string {
  let digits = digitsOnly(value);
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);

  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return parts.filter(Boolean).join(' ');
}

/** 4 xonali tasdiqlash kodi. */
export function isValidOtp(value: string): boolean {
  return /^\d{4}$/.test(value.trim());
}

/** Sotuvchi mahsuloti matn maydonlari chegaralari. */
export const SELLER_LIMITS = {
  title: 120,
  description: 2000,
  fileSize: 32,
  fileType: 60,
  feature: 80,
  features: 10,
} as const;

export interface SellerProductText {
  title: string;
  description: string;
  fileSize: string;
  fileType: string;
  features: string[];
}

export type SellerProductField = keyof SellerProductText;

export type SellerProductValidation =
  | { ok: true; value: SellerProductText }
  | { ok: false; field: SellerProductField; reason: 'required' | 'too-long' | 'too-many' };

/**
 * Boshqaruv belgilarini olib tashlaydi va chetdagi probellarni kesadi.
 * Ko'p qatorli maydonda faqat qator uzilishi saqlanadi.
 */
export function sanitizeText(value: string, options: { multiline?: boolean } = {}): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    const isControl = code < 0x20 || code === 0x7f;
    if (!isControl) out += ch;
    else if (options.multiline && ch === '\n') out += ch;
    else if (!options.multiline) out += ' ';
  }
  return out.trim();
}

/**
 * Sotuvchi kiritgan matnni tekshiradi.
 *
 * Avval hech qanday uzunlik chegarasi yo'q edi: bitta sotuvchi megabaytlik
 * tavsif kiritib, `localStorage` kvotasini to'ldirishi va jadval maketini
 * buzishi mumkin edi.
 */
export function validateSellerProduct(input: SellerProductText): SellerProductValidation {
  const value: SellerProductText = {
    title: sanitizeText(input.title),
    description: sanitizeText(input.description, { multiline: true }),
    fileSize: sanitizeText(input.fileSize),
    fileType: sanitizeText(input.fileType),
    features: input.features.map((feature) => sanitizeText(feature)).filter(Boolean),
  };

  const singleLineFields = ['title', 'description', 'fileSize', 'fileType'] as const;
  for (const field of singleLineFields) {
    if (value[field] === '') return { ok: false, field, reason: 'required' };
    if (value[field].length > SELLER_LIMITS[field]) return { ok: false, field, reason: 'too-long' };
  }

  if (value.features.length > SELLER_LIMITS.features) {
    return { ok: false, field: 'features', reason: 'too-many' };
  }
  if (value.features.some((feature) => feature.length > SELLER_LIMITS.feature)) {
    return { ok: false, field: 'features', reason: 'too-long' };
  }

  return { ok: true, value };
}
