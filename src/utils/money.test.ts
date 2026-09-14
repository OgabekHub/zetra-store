import { describe, expect, it } from 'vitest';
import { addMoney, mulMoney, parseSellerPrice, roundMoney } from './money';
import { formatExchangeRate, formatPrice } from './price';

describe('pul arifmetikasi', () => {
  it('suzuvchi nuqta artefaktlarini sentgacha yaxlitlaydi', () => {
    // 24.99 * 5 === 124.94999999999999
    expect(mulMoney(24.99, 5)).toBe(124.95);
    // 29.99 + 19 === 48.989999999999995
    expect(addMoney(29.99, 19)).toBe(48.99);
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(roundMoney(124.94999999999999)).toBe(124.95);
  });
});

describe('parseSellerPrice', () => {
  it.each([
    ['29.99', 29.99],
    ['29,99', 29.99],
    ['  10 ', 10],
    ['1000000', 1_000_000],
  ])('%s -> %s', (input, expected) => {
    expect(parseSellerPrice(input)).toBe(expected);
  });

  // Regressiya: avval yalang'och parseFloat "29.999" ni qabul qilib, uni
  // "$30.00" deb ko'rsatib, "29.999" sifatida saqlardi.
  it.each(['29.999', '0', '-1', '1000000.01', 'abc', '.5', '5.', '1e3', ''])('%s rad etiladi', (input) => {
    expect(parseSellerPrice(input)).toBeNull();
  });
});

describe('formatPrice', () => {
  it('USD ni ikki xona kasr bilan', () => {
    expect(formatPrice(49.5, 'USD')).toBe('$49.50');
  });

  it('UZS ni kursga ko\'paytirib, oddiy probel bilan guruhlaydi', () => {
    expect(formatPrice(1, 'UZS', 12800)).toBe("12 800 so'm");
    expect(formatPrice(29.99, 'UZS', 12800)).toBe("383 872 so'm");
  });

  // Regressiya: `uz-UZ` guruhlash uchun U+00A0 qo'yadi va avvalgi
  // `.replace(/,/g, ' ')` hech narsa qilmasdi.
  it('chiqishda uzilmas probel qolmaydi', () => {
    expect(formatPrice(123456, 'UZS', 12800)).not.toMatch(/ | /);
  });

  it('yaroqsiz qiymat va kursda yiqilmaydi', () => {
    expect(formatPrice(Number.NaN, 'USD')).toBe('$0.00');
    expect(formatPrice(Number.NaN, 'UZS')).toBe("0 so'm");
    expect(formatPrice(1, 'UZS', 0)).toBe("12 800 so'm");
    expect(formatPrice(1, 'UZS', Number.NaN)).toBe("12 800 so'm");
  });

  it('kursni tost uchun formatlaydi', () => {
    expect(formatExchangeRate(12845.6)).toBe('12 846');
  });
});
