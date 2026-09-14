import { describe, expect, it } from 'vitest';

const isString = (value: unknown) => (typeof value === 'string' ? value : null);

describe('createCappedLogStore', () => {
  async function makeLog() {
    const { createCappedLogStore } = await import('./createCappedLogStore');
    return createCappedLogStore<string>({ key: 'test-log', version: 1, max: 3, validateEntry: isString });
  }

  it('yangilarini boshiga qo\'shadi va chegaradan oshganini kesadi', async () => {
    const log = await makeLog();
    log.appendMany(['a', 'b']);
    log.append('c');
    log.append('d');
    expect(log.getSnapshot()).toEqual(['d', 'c', 'a']);
  });

  it('bo\'sh qo\'shish va hech narsa olib tashlamaydigan prune holatni o\'zgartirmaydi', async () => {
    const log = await makeLog();
    log.append('a');
    const snapshot = log.getSnapshot();
    log.appendMany([]);
    log.prune(() => true);
    expect(log.getSnapshot()).toBe(snapshot);

    log.prune((entry) => entry !== 'a');
    expect(log.getSnapshot()).toEqual([]);
  });

  it('saqlangan juda uzun ro\'yxatni yuklashda kesadi', async () => {
    localStorage.setItem('test-log', JSON.stringify({ v: 1, data: ['1', '2', '3', '4', '5', 6] }));
    const log = await makeLog();
    expect(log.getSnapshot()).toEqual(['1', '2', '3']);
  });
});

describe('applyDocumentPreferences', () => {
  it('<html> klassi va lang atributini yangilaydi', async () => {
    const { applyDocumentPreferences } = await import('./preferencesStore');
    applyDocumentPreferences('light', 'ru');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.lang).toBe('ru');

    applyDocumentPreferences('dark', 'en');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('resolveSiteUrl', () => {
  it('yaroqli manzilni qabul qiladi', async () => {
    const { resolveSiteUrl } = await import('@/utils/site');
    expect(resolveSiteUrl('https://staging.zetra.uz').origin).toBe('https://staging.zetra.uz');
  });

  // Regressiya: bo'sh o'zgaruvchi `new URL('')` bilan butun build'ni yiqitardi.
  it.each([undefined, '', '   ', 'bu manzil emas', 'javascript:alert(1)', 'ftp://zetra.uz'])(
    '%s uchun standart manzilga qaytadi',
    async (raw) => {
      const { resolveSiteUrl } = await import('@/utils/site');
      expect(resolveSiteUrl(raw).origin).toBe('https://zetra.uz');
    },
  );
});
