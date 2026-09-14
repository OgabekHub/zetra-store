import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeTranslations,
  analyzeUsage,
  extractTranslations,
  runCheck,
  scanSources,
} from './check-i18n.mjs';

function fixture(body) {
  return (
    "export type Language = 'uz' | 'ru' | 'en';\n" +
    'export const translations: Record<Language, Record<string, string>> = {\n' +
    body +
    '\n};\n'
  );
}

function check(body) {
  return analyzeTranslations(extractTranslations(fixture(body)));
}

describe('analyzeTranslations', () => {
  it('toza jadvalda xato bermaydi', () => {
    const result = check(`
      uz: { "salom": "Salom", "ism": "Ism: {name}" },
      ru: { "salom": "Привет", "ism": "Имя: {name}" },
      en: { "salom": "Hello", "ism": "Name: {name}" },
    `);
    expect(result.errors).toEqual([]);
  });

  it('yetishmaydigan kalitni topadi', () => {
    const result = check(`
      uz: { "a": "A", "b": "B" },
      ru: { "a": "А" },
      en: { "a": "A", "b": "B" },
    `);
    expect(result.errors).toContain('[ru] kalit yetishmaydi: b');
  });

  // JS obyektida takroriy kalit xatosiz, jimgina oldingisini bekor qiladi.
  it('takroriy kalitni topadi', () => {
    const result = check(`
      uz: { "a": "A", "a": "A2" },
      ru: { "a": "А" },
      en: { "a": "A" },
    `);
    expect(result.errors).toContain('[uz] takroriy kalit: a');
  });

  // Regressiya: UserProfileModal.tsx dagi ruscha matn aynan shunday edi.
  it('ikki marta kodlangan matnni (mojibake) topadi', () => {
    const result = check(`
      uz: { "a": "Ism" },
      ru: { "a": "Ð˜Ð¼Ñ" },
      en: { "a": "Name" },
    `);
    expect(result.errors).toContain('[ru] buzilgan kodirovka (mojibake): a');
  });

  it('bo\'sh qiymat va yo\'qolgan tilni topadi', () => {
    const result = check(`
      uz: { "a": "  " },
      ru: { "a": "А" },
    `);
    expect(result.errors).toContain('[uz] bo\'sh qiymat: a');
    expect(result.errors).toContain('"en" tili topilmadi');
  });

  it('tillar orasida mos kelmaydigan o\'rinbosarlarni topadi', () => {
    const result = check(`
      uz: { "a": "Salom, {name}" },
      ru: { "a": "Привет" },
      en: { "a": "Hi, {name}" },
    `);
    expect(result.errors).toContain("o'rinbosarlar tillar orasida mos emas: a");
  });

  it('satr bo\'lmagan qiymatni topadi', () => {
    const result = check(`
      uz: { "a": someVariable },
      ru: { "a": "А" },
      en: { "a": "A" },
    `);
    expect(result.errors).toContain('[uz] satr bo\'lmagan qiymat: a');
  });

  it('translations obyekti bo\'lmasa aniq xabar beradi', () => {
    expect(() => extractTranslations('export const other = {};')).toThrow(/translations/);
  });
});

describe('analyzeUsage', () => {
  const files = [
    {
      path: 'src/A.tsx',
      text: "const x = t('mavjud');\nconst y = t(\"yoq_kalit\");\nconst key = 'dinamik';",
    },
  ];

  it('kodda chaqirilgan, lekin jadvalda yo\'q kalitni joyi bilan xato qiladi', () => {
    const result = analyzeUsage(new Set(['mavjud', 'dinamik', 'eskirgan']), scanSources(files));
    expect(result.errors).toEqual(["kodda ishlatilgan, lekin tarjimada yo'q: yoq_kalit (src/A.tsx:2)"]);
  });

  it('hech qayerda uchramaydigan kalitni faqat ogohlantiradi', () => {
    const result = analyzeUsage(new Set(['mavjud', 'dinamik', 'eskirgan']), scanSources(files));
    expect(result.warnings).toEqual(['ishlatilmayotgan kalit: eskirgan']);
  });

  it('set( yoki boshqa so\'z ichidagi t( ni chaqiruv deb hisoblamaydi', () => {
    const { called } = scanSources([{ path: 'x.ts', text: "set('a'); toast.t2('b'); t('c')" }]);
    expect([...called.keys()]).toEqual(['c']);
  });
});

describe('haqiqiy loyiha', () => {
  it('translations.ts va kod o\'rtasida xato yo\'q', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const result = runCheck(root);
    expect(result.localeCount).toBe(3);
    expect(result.errors).toEqual([]);
  });
});
