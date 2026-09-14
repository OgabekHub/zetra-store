import { describe, expect, it } from 'vitest';
import {
  MAX_PASSWORD_LENGTH,
  SELLER_LIMITS,
  sanitizeText,
  validateSellerProduct,
  digitsOnly,
  formatCardExpiry,
  formatCardNumber,
  formatUzPhone,
  isValidCardExpiry,
  isValidCvv,
  isValidEmail,
  isValidOtp,
  isValidPassword,
  isValidUzPhone,
  luhnCheck,
} from './validation';

describe('isValidEmail', () => {
  it.each(['user@mail.uz', 'a.b+tag@example.co.uk', '  ali@zetra.uz  '])('%s yaroqli', (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  // Avval faqat brauzerning type="email" i ishlardi va `a@b` ham o'tardi.
  it.each(['a@b', 'no-at.uz', 'user@', '@mail.uz', 'a b@mail.uz', 'user@mail', ''])(
    '%s yaroqsiz',
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );
});

describe('isValidPassword', () => {
  it('kamida 8, ko\'pi bilan 128 belgi talab qiladi', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('x'.repeat(MAX_PASSWORD_LENGTH))).toBe(true);
    expect(isValidPassword('x'.repeat(MAX_PASSWORD_LENGTH + 1))).toBe(false);
  });
});

describe('digitsOnly', () => {
  it('raqam bo\'lmagan hamma narsani olib tashlaydi', () => {
    expect(digitsOnly('+998 (90) 123-45-67')).toBe('998901234567');
  });
});

describe('luhnCheck', () => {
  it.each(['4111 1111 1111 1111', '5555555555554444', '4012888888881881'])('%s yaroqli', (card) => {
    expect(luhnCheck(card)).toBe(true);
  });

  it.each([
    '4111111111111112', // nazorat raqami noto'g'ri
    '0000 0000 0000 0000', // Luhn bo'yicha o'tadi, lekin ataylab rad etiladi
    '1234',
    'abcd efgh ijkl mnop',
  ])('%s yaroqsiz', (card) => {
    expect(luhnCheck(card)).toBe(false);
  });
});

describe('formatCardNumber', () => {
  it('4 talik guruhlarga ajratadi va 16 raqamdan oshmaydi', () => {
    expect(formatCardNumber('41111111111111119999')).toBe('4111 1111 1111 1111');
    expect(formatCardNumber('41111')).toBe('4111 1');
  });
});

describe('formatCardExpiry', () => {
  it('yozishda ikki raqamdan keyin slash qo\'yadi', () => {
    expect(formatCardExpiry('1', '')).toBe('1');
    expect(formatCardExpiry('12', '1')).toBe('12/');
    expect(formatCardExpiry('12/3', '12/')).toBe('12/3');
    expect(formatCardExpiry('1234', '')).toBe('12/34');
  });

  // Regressiya: avval "12/" dan backspace bosilsa qiymat yana "12/" bo'lardi
  // va foydalanuvchi xato yozilgan oyni hech qachon o'chira olmasdi.
  it('o\'chirishda slashni qayta qo\'ymaydi', () => {
    expect(formatCardExpiry('12', '12/')).toBe('12');
    expect(formatCardExpiry('1', '12')).toBe('1');
    expect(formatCardExpiry('', '1')).toBe('');
  });
});

describe('isValidCardExpiry', () => {
  const now = new Date(2026, 8, 14); // 2026-yil sentyabr

  it('kelajakdagi va joriy oyni qabul qiladi', () => {
    expect(isValidCardExpiry('12/30', now)).toBe(true);
    expect(isValidCardExpiry('09/26', now)).toBe(true);
  });

  it.each(['08/26', '13/30', '00/30', '99/99', '1/30', '12/60', 'ab/cd'])('%s yaroqsiz', (value) => {
    expect(isValidCardExpiry(value, now)).toBe(false);
  });
});

describe('isValidCvv', () => {
  it('3 yoki 4 raqam', () => {
    expect(isValidCvv('123')).toBe(true);
    expect(isValidCvv('1234')).toBe(true);
    expect(isValidCvv('12')).toBe(false);
    expect(isValidCvv('abc')).toBe(false);
  });
});

describe('isValidUzPhone', () => {
  it.each(['+998 90 123 45 67', '901234567', '998 (33) 123-45-67', '88 123 45 67'])('%s yaroqli', (value) => {
    expect(isValidUzPhone(value)).toBe(true);
  });

  // Avval faqat uzunlik tekshirilardi va "abcdefghi" to'lovga o'tardi.
  it.each(['abcdefghi', '12 345 67 89', '90 123 45 6', '+7 900 123 45 67'])('%s yaroqsiz', (value) => {
    expect(isValidUzPhone(value)).toBe(false);
  });
});

describe('formatUzPhone', () => {
  it('davlat kodini olib tashlab, guruhlaydi', () => {
    expect(formatUzPhone('998901234567')).toBe('90 123 45 67');
    expect(formatUzPhone('90123')).toBe('90 123');
    expect(formatUzPhone('+998 (90) 123-45-67-99')).toBe('90 123 45 67');
  });
});

describe('isValidOtp', () => {
  it('aynan 4 raqam', () => {
    expect(isValidOtp('1234')).toBe(true);
    expect(isValidOtp('123')).toBe(false);
    expect(isValidOtp('12a4')).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('boshqaruv belgilarini olib tashlaydi', () => {
    expect(sanitizeText('  Nom\u0000\u0007 ')).toBe('Nom');
    expect(sanitizeText('a\tb')).toBe('a b');
  });

  it('ko\'p qatorli maydonda faqat qator uzilishini saqlaydi', () => {
    expect(sanitizeText('1-qator\n2-qator\u0000', { multiline: true })).toBe('1-qator\n2-qator');
  });
});

describe('validateSellerProduct', () => {
  const valid = {
    title: '  UI Kit  ',
    description: 'Tavsif',
    fileSize: '12 MB',
    fileType: 'Figma',
    features: ['Tez', '  ', 'Qulay'],
  };

  it('yaroqli ma\'lumotni tozalab qaytaradi', () => {
    const result = validateSellerProduct(valid);
    expect(result).toEqual({
      ok: true,
      value: { ...valid, title: 'UI Kit', features: ['Tez', 'Qulay'] },
    });
  });

  it('bo\'sh majburiy maydonni rad etadi', () => {
    expect(validateSellerProduct({ ...valid, fileType: '   ' })).toEqual({
      ok: false,
      field: 'fileType',
      reason: 'required',
    });
  });

  // Avval hech qanday chegara yo'q edi va megabaytlik tavsif localStorage
  // kvotasini to'ldirardi.
  it('juda uzun matnni rad etadi', () => {
    expect(validateSellerProduct({ ...valid, description: 'x'.repeat(SELLER_LIMITS.description + 1) })).toEqual({
      ok: false,
      field: 'description',
      reason: 'too-long',
    });
    expect(
      validateSellerProduct({ ...valid, features: ['x'.repeat(SELLER_LIMITS.feature + 1)] }),
    ).toEqual({ ok: false, field: 'features', reason: 'too-long' });
  });

  it('juda ko\'p xususiyatni rad etadi', () => {
    const features = Array.from({ length: SELLER_LIMITS.features + 1 }, (_, i) => `F${i}`);
    expect(validateSellerProduct({ ...valid, features })).toEqual({
      ok: false,
      field: 'features',
      reason: 'too-many',
    });
  });
});
