import { describe, expect, it } from 'vitest';
import {
  ALL_CATEGORIES,
  CATEGORY_TRANSLATION_KEYS,
  categoryToSlug,
  getCategoryLabel,
  slugToCategory,
} from './categories';
import { serializeJsonLd } from './jsonLd';
import { isAllowedImageUrl } from './images';
import { formatDate, formatDateTime, LOCALE_TAG, pickLocalized } from './locale';
import { isDateString, oneOf, parseArrayOf, isSafeObjectKey } from './guards';
import nextConfig from '../../next.config';

describe('kategoriya slug\'lari', () => {
  it('har bir kategoriya o\'z slug\'i orqali qaytib topiladi', () => {
    for (const category of ALL_CATEGORIES) {
      expect(slugToCategory(categoryToSlug(category))).toBe(category);
    }
  });

  // Regressiya: "O'yin va Hisoblar" -> "o'yin-va-hisoblar" bo'lib, sitemap'da
  // xom apostrof, havolalarda esa %27 bilan ikki xil URL paydo bo'lardi.
  it('slug\'lar faqat URL-xavfsiz belgilardan iborat', () => {
    for (const category of ALL_CATEGORIES) {
      expect(categoryToSlug(category)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
    expect(categoryToSlug("O'yin va Hisoblar")).toBe('oyin-va-hisoblar');
  });

  it('noma\'lum nom uchun ham xavfsiz slug hosil qiladi', () => {
    expect(categoryToSlug('Yangi Bo‘lim!')).toBe('yangi-bo-lim');
    expect(slugToCategory('mavjud-emas')).toBeUndefined();
  });

  it('yorliqni tarjima orqali beradi, noma\'lumini o\'zgartirmaydi', () => {
    const t = (key: string) => `T(${key})`;
    expect(getCategoryLabel('3D Modellar', t)).toBe(`T(${CATEGORY_TRANSLATION_KEYS['3D Modellar']})`);
    expect(getCategoryLabel('Noma\'lum', t)).toBe('Noma\'lum');
  });
});

describe('serializeJsonLd', () => {
  const hostile = { name: '</script><script>alert(1)</script>', note: 'a & b > c' };

  it('HTML tahlilchisini chalg\'itadigan belgilarni qoldirmaydi', () => {
    const output = serializeJsonLd(hostile);
    expect(output).not.toMatch(/[<>&]/);
  });

  it('natija baribir yaroqli JSON va asl ma\'lumotni saqlaydi', () => {
    expect(JSON.parse(serializeJsonLd(hostile))).toEqual(hostile);
  });
});

describe('isAllowedImageUrl', () => {
  it.each([
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070',
    'https://images.unsplash.com/photo-1',
  ])('%s ruxsat etilgan', (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    'http://images.unsplash.com/photo-1', // https emas
    'https://evil.example.com/x.png',
    'https://images.unsplash.com.evil.com/photo-1',
    'https://images.unsplash.com/other/path.png', // next.config pathname'iga mos emas
    'https://user:pass@images.unsplash.com/photo-1',
    'https://images.unsplash.com:8443/photo-1',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    '/local.png',
    '',
  ])('%s rad etiladi', (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });

  // `next/image` ruxsat etilmagan manzilda render paytida istisno tashlaydi va
  // butun jadvalni oq ekranga aylantiradi. Shuning uchun tekshiruv
  // `next.config.ts` bilan aynan mos bo'lishi shart.
  it('next.config.ts dagi remotePatterns bilan mos keladi', () => {
    const patterns = nextConfig.images?.remotePatterns ?? [];
    expect(patterns.length).toBeGreaterThan(0);
    for (const pattern of patterns) {
      if (pattern instanceof URL) continue;
      const sample = `${pattern.protocol ?? 'https'}://${pattern.hostname}${(pattern.pathname ?? '/').replace('**', 'x').replace('*', 'abc')}`;
      expect(isAllowedImageUrl(sample)).toBe(true);
    }
  });
});

describe('locale', () => {
  it('uchala til uchun Intl tegi bor', () => {
    expect(Object.keys(LOCALE_TAG).sort()).toEqual(['en', 'ru', 'uz']);
  });

  it('yaroqsiz sanada bo\'sh satr qaytaradi, istisno tashlamaydi', () => {
    expect(formatDateTime('not-a-date', 'uz')).toBe('');
    expect(formatDate('not-a-date', 'ru')).toBe('');
    expect(formatDate('2026-09-14T10:00:00.000Z', 'en')).not.toBe('');
  });
});

describe('guards', () => {
  it('parseArrayOf yaroqsiz elementni tashlaydi yoki butun massivni rad etadi', () => {
    const parseNumber = (value: unknown) => (typeof value === 'number' ? value : null);
    expect(parseArrayOf([1, 'x', 2], parseNumber, true)).toEqual([1, 2]);
    expect(parseArrayOf([1, 'x', 2], parseNumber, false)).toBeNull();
    expect(parseArrayOf('not-array', parseNumber, true)).toBeNull();
  });

  it('oneOf faqat ruxsat etilgan satrlarni qabul qiladi', () => {
    const isTheme = oneOf(['light', 'dark'] as const);
    expect(isTheme('light')).toBe(true);
    expect(isTheme('blue')).toBe(false);
    expect(isTheme(1)).toBe(false);
  });

  it('isDateString', () => {
    expect(isDateString('2026-09-14T10:00:00.000Z')).toBe(true);
    expect(isDateString('')).toBe(false);
    expect(isDateString('ertaga')).toBe(false);
  });

  it('isSafeObjectKey prototipni ifloslantiradigan kalitlarni rad etadi', () => {
    expect(isSafeObjectKey('user-1:5')).toBe(true);
    expect(isSafeObjectKey('__proto__')).toBe(false);
    expect(isSafeObjectKey('constructor')).toBe(false);
    expect(isSafeObjectKey('prototype')).toBe(false);
  });
});

describe('pickLocalized', () => {
  it('joriy tilning qiymatini qaytaradi', () => {
    const values = { uz: 'Dush', ru: 'Пн', en: 'Mon' };
    expect(pickLocalized('uz', values)).toBe('Dush');
    expect(pickLocalized('ru', values)).toBe('Пн');
    expect(pickLocalized('en', values)).toBe('Mon');
  });
});
