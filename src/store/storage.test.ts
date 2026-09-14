import { describe, expect, it, vi } from 'vitest';

async function load() {
  return import('./storage');
}

const isStringArray = (raw: unknown) =>
  Array.isArray(raw) && raw.every((item) => typeof item === 'string') ? (raw as string[]) : null;

describe('readValidated', () => {
  it('kalit yo\'q bo\'lsa missing', async () => {
    const { readValidated } = await load();
    expect(readValidated('k', 1, isStringArray)).toEqual({ ok: false, reason: 'missing' });
  });

  it('konvertdagi yaroqli qiymatni qaytaradi', async () => {
    const { readValidated } = await load();
    localStorage.setItem('k', JSON.stringify({ v: 1, data: ['a'] }));
    expect(readValidated('k', 1, isStringArray)).toEqual({ ok: true, value: ['a'] });
  });

  it('JSON bo\'lmagan qiymat migratsiyasiz malformed', async () => {
    const { readValidated } = await load();
    localStorage.setItem('k', '{{{');
    expect(readValidated('k', 1, isStringArray)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('sxemaga mos kelmasa invalid', async () => {
    const { readValidated } = await load();
    localStorage.setItem('k', JSON.stringify({ v: 1, data: [1, 2] }));
    expect(readValidated('k', 1, isStringArray)).toEqual({ ok: false, reason: 'invalid' });
  });

  // Regressiya: konvertsiz eski qiymat (masalan, eski savat massivi) migratsiya
  // funksiyasi berilmagan bo'lsa jimgina tashlab yuborilardi.
  it('konvertsiz eski qiymat sxemaga mos bo\'lsa saqlanadi', async () => {
    const { readValidated } = await load();
    localStorage.setItem('k', JSON.stringify(['eski']));
    expect(readValidated('k', 1, isStringArray)).toEqual({ ok: true, value: ['eski'], migrated: true });
  });

  // Regressiya: eski kod mavzu va tilni JSON'siz xom satr sifatida yozardi.
  it('JSON bo\'lmagan eski xom satrni migratsiya orqali o\'qiydi', async () => {
    const { readValidated } = await load();
    localStorage.setItem('k', 'light');
    const result = readValidated(
      'k',
      1,
      (raw) => (raw === 'light' || raw === 'dark' ? raw : null),
      (_from, data) => (data === 'light' || data === 'dark' ? data : null),
    );
    expect(result).toEqual({ ok: true, value: 'light', migrated: true });
  });

  it('migratsiya null qaytarsa version', async () => {
    const { readValidated } = await load();
    localStorage.setItem('k', JSON.stringify({ v: 1, data: 'x' }));
    expect(readValidated('k', 2, () => null, () => null)).toEqual({ ok: false, reason: 'version' });
  });
});

describe('writeValidated', () => {
  it('konvertga o\'rab yozadi', async () => {
    const { writeValidated } = await load();
    expect(writeValidated('k', 3, { a: 1 })).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem('k') ?? 'null')).toEqual({ v: 3, data: { a: 1 } });
  });

  // Regressiya: avval birorta setItem try/catch ichida emas edi va Safari
  // private mode'da QuotaExceededError to'g'ridan-to'g'ri chiqardi.
  it('kvota xatosini tutadi va istisno tashlamaydi', async () => {
    const { writeValidated, isStorageAvailable } = await load();
    expect(isStorageAvailable()).toBe(true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(writeValidated('k', 1, ['a'])).toEqual({ ok: false, reason: 'quota' });
  });

  it('seriyalab bo\'lmaydigan qiymatda serialize', async () => {
    const { writeValidated } = await load();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(writeValidated('k', 1, cyclic)).toEqual({ ok: false, reason: 'serialize' });
  });

  it('saqlash umuman ishlamasa unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const { writeValidated, readValidated } = await load();
    expect(writeValidated('k', 1, ['a'])).toEqual({ ok: false, reason: 'unavailable' });
    expect(readValidated('k', 1, isStringArray)).toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('subscribeToKey', () => {
  it('shu tabdagi yozuv va o\'chirishni bildiradi', async () => {
    const { subscribeToKey, writeValidated, removeKey } = await load();
    const listener = vi.fn();
    const unsubscribe = subscribeToKey('k', listener);

    writeValidated('k', 1, ['a']);
    writeValidated('other', 1, ['b']);
    removeKey('k');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    writeValidated('k', 1, ['c']);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('boshqa tabdagi o\'zgarish va localStorage.clear() ni bildiradi', async () => {
    const { subscribeToKey } = await load();
    const listener = vi.fn();
    subscribeToKey('k', listener);

    window.dispatchEvent(new StorageEvent('storage', { key: 'k' }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
