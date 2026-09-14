import { describe, expect, it } from 'vitest';
import {
  FX_RATE_MAX,
  FX_RATE_MIN,
  parseAccountMap,
  parseCachedFxRate,
  parseCart,
  parseCatalogOverlay,
  parseCurrency,
  parseDownloadLimits,
  parseExchangeRate,
  parseLanguage,
  parseProduct,
  parsePurchase,
  parseSecurityKeyMap,
  parseSecurityLog,
  parseSession,
  parseTheme,
  parseUserProfile,
} from './index';
import { SEED_PRODUCTS } from '@/data/products';

const product = SEED_PRODUCTS[0];

describe('parseProduct', () => {
  it('fixture mahsulotini o\'zgarishsiz qabul qiladi', () => {
    expect(parseProduct(product)).toEqual(product);
  });

  it('har bir fixture mahsuloti sxemaga mos keladi', () => {
    for (const item of SEED_PRODUCTS) {
      expect(parseProduct(item), `id=${item.id}`).not.toBeNull();
    }
  });

  it.each([
    ['sarlavhasiz', { ...product, title: '' }],
    ['manfiy narx', { ...product, price: -1 }],
    ['NaN narx', { ...product, price: Number.NaN }],
    ['butun bo\'lmagan id', { ...product, id: 1.5 }],
    ['rasm yo\'q', { ...product, image: undefined }],
    ['massiv emas', [product]],
    ['null', null],
  ])('%s rad etiladi', (_label, raw) => {
    expect(parseProduct(raw)).toBeNull();
  });

  it('noma\'lum maydonlarni tashlaydi va satr bo\'lmagan xususiyatlarni olib tashlaydi', () => {
    const parsed = parseProduct({ ...product, features: ['a', 42, 'b'], injected: '<script>' });
    expect(parsed?.features).toEqual(['a', 'b']);
    expect(parsed).not.toHaveProperty('injected');
  });
});

describe('parseCart', () => {
  it('yaroqsiz qatorni tashlaydi, qolganini saqlaydi', () => {
    const cart = parseCart([
      { ...product, quantity: 2 },
      { ...product, id: 2, quantity: 0 },
      { id: 3 },
      'garbage',
    ]);
    expect(cart).toHaveLength(1);
    expect(cart?.[0].quantity).toBe(2);
  });

  // Regressiya: avval `cart.reduce` massiv bo'lmagan qiymatda yiqilardi.
  it('massiv bo\'lmasa null qaytaradi', () => {
    expect(parseCart({ nope: 1 })).toBeNull();
  });
});

describe('parseCatalogOverlay', () => {
  it('to\'g\'ri shaklni qabul qiladi', () => {
    expect(parseCatalogOverlay({ custom: [product], hiddenSeedIds: [3, 'x', -1] })).toEqual({
      custom: [product],
      hiddenSeedIds: [3],
    });
  });

  it('shakl buzilgan bo\'lsa null', () => {
    expect(parseCatalogOverlay({ custom: 'x', hiddenSeedIds: [] })).toBeNull();
    expect(parseCatalogOverlay(null)).toBeNull();
  });
});

describe('foydalanuvchi va hisob', () => {
  it('parseUserProfile barcha maydonlarni talab qiladi', () => {
    expect(parseUserProfile({ id: 'u1', name: 'Ali', email: 'ali@mail.uz' })).toEqual({
      id: 'u1',
      name: 'Ali',
      email: 'ali@mail.uz',
    });
    // Regressiya: avval `{"nam":"x"}` saqlangan bo'lsa `name.charAt(0)` yiqilardi.
    expect(parseUserProfile({ nam: 'x' })).toBeNull();
    expect(parseUserProfile({ name: 'Ali', email: 'ali@mail.uz' })).toBeNull();
  });

  it('parseAccountMap yaroqsiz yozuvlarni va xavfli kalitlarni tashlaydi', () => {
    const raw = JSON.parse(
      '{"ali@mail.uz":{"id":"u1","email":"ali@mail.uz","name":"Ali","createdAt":"2026-09-14T00:00:00.000Z"},' +
        '"bad":{"id":""},' +
        '"__proto__":{"id":"u2","email":"x@mail.uz","name":"X","createdAt":"2026-09-14T00:00:00.000Z"}}',
    );
    const map = parseAccountMap(raw);
    expect(Object.keys(map ?? {})).toEqual(['ali@mail.uz']);
    expect(Object.getPrototypeOf(map)).toBe(Object.prototype);
  });
});

describe('sessiya va jurnal', () => {
  const session = {
    id: 'SES-1',
    email: 'ali@mail.uz',
    device: 'Chrome (Windows)',
    ip: '213.230.76.1',
    lastActive: '2026-09-14T00:00:00.000Z',
    isCurrent: 'yes',
  };

  it('parseSession isCurrent ni qat\'iy boolean qiladi', () => {
    expect(parseSession(session)?.isCurrent).toBe(false);
    expect(parseSession({ ...session, isCurrent: true })?.isCurrent).toBe(true);
    expect(parseSession({ ...session, lastActive: 'kecha' })).toBeNull();
  });

  it('parseSecurityLog noma\'lum holatni rad etadi', () => {
    const log = {
      id: 'LOG-1',
      email: 'ali@mail.uz',
      event: 'login',
      ip: '1.1.1.1',
      device: 'Chrome',
      date: '2026-09-14T00:00:00.000Z',
      status: 'success',
    };
    expect(parseSecurityLog(log)).toEqual(log);
    expect(parseSecurityLog({ ...log, status: 'hacked' })).toBeNull();
  });
});

describe('parsePurchase', () => {
  const purchase = {
    id: 'ZTR-123456',
    userId: 'u1',
    total: 59.98,
    purchasedAt: '2026-09-14T00:00:00.000Z',
    lines: [{ productId: product.id, quantity: 2, unitPrice: product.price, product }],
  };

  it('to\'g\'ri buyurtmani qabul qiladi', () => {
    expect(parsePurchase(purchase)).toEqual(purchase);
  });

  it('egasiz yoki bo\'sh buyurtmani rad etadi', () => {
    expect(parsePurchase({ ...purchase, userId: '' })).toBeNull();
    expect(parsePurchase({ ...purchase, lines: [] })).toBeNull();
    expect(parsePurchase({ ...purchase, lines: [{ ...purchase.lines[0], quantity: 0 }] })).toBeNull();
  });

  // Eski format (egasiz Product[]) yangi sxemaga mos kelmaydi.
  it('eski egasiz mahsulot ro\'yxatini qabul qilmaydi', () => {
    expect(parsePurchase(product)).toBeNull();
  });
});

describe('xaritalar', () => {
  it('parseDownloadLimits manfiy va butun bo\'lmagan qiymatlarni tashlaydi', () => {
    expect(parseDownloadLimits({ 'u1:1': 5, 'u1:2': -1, 'u1:3': 2.5, 'u1:4': '3', 'u1:5': 0 })).toEqual({
      'u1:1': 5,
      'u1:5': 0,
    });
  });

  it('parseSecurityKeyMap to\'liq bo\'lmagan juftlikni tashlaydi', () => {
    expect(
      parseSecurityKeyMap({ 'u1:1': { license: 'L', decrypt: 'D' }, 'u1:2': { license: 'L' } }),
    ).toEqual({ 'u1:1': { license: 'L', decrypt: 'D' } });
  });

  it('xavfli kalitlar orqali prototip o\'zgartirilmaydi', () => {
    const limits = parseDownloadLimits(JSON.parse('{"__proto__": 5, "constructor": 3, "u1:1": 2}'));
    expect(limits).toEqual({ 'u1:1': 2 });
    const keys = parseSecurityKeyMap(JSON.parse('{"__proto__": {"license":"L","decrypt":"D"}}'));
    expect(Object.getPrototypeOf(keys)).toBe(Object.prototype);
    expect((keys as Record<string, unknown>).license).toBeUndefined();
  });
});

describe('primitivlar', () => {
  it('valyuta, mavzu va til', () => {
    expect(parseCurrency('UZS')).toBe('UZS');
    expect(parseCurrency('EUR')).toBeNull();
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('blue')).toBeNull();
    expect(parseLanguage('ru')).toBe('ru');
    expect(parseLanguage('de')).toBeNull();
  });

  // Tekshiruv diapazon bo'lishi kerak: "12800" satri songa aylanadi va
  // muammo tug'dirmaydi, "n/a" esa NaN beradi.
  it('parseExchangeRate diapazon bo\'yicha tekshiradi', () => {
    expect(parseExchangeRate(12800)).toBe(12800);
    expect(parseExchangeRate('12800')).toBe(12800);
    expect(parseExchangeRate('n/a')).toBeNull();
    expect(parseExchangeRate({})).toBeNull();
    expect(parseExchangeRate(FX_RATE_MIN - 1)).toBeNull();
    expect(parseExchangeRate(FX_RATE_MAX + 1)).toBeNull();
  });

  it('parseCachedFxRate', () => {
    expect(parseCachedFxRate({ rate: 13000, fetchedAt: '2026-09-14T00:00:00.000Z' })).toEqual({
      rate: 13000,
      fetchedAt: '2026-09-14T00:00:00.000Z',
    });
    expect(parseCachedFxRate({ rate: 'banana', fetchedAt: '2026-09-14T00:00:00.000Z' })).toBeNull();
  });
});
