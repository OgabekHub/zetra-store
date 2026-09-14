import { describe, expect, it, vi } from 'vitest';

const isStringArray = (raw: unknown) =>
  Array.isArray(raw) && raw.every((item) => typeof item === 'string') ? (raw as string[]) : null;

const EMPTY: string[] = [];

async function makeStore(key = 'test-key') {
  const { createPersistentStore } = await import('./createPersistentStore');
  return createPersistentStore<string[]>({
    key,
    version: 1,
    fallback: () => EMPTY,
    validate: isStringArray,
  });
}

describe('createPersistentStore — snapshot barqarorligi', () => {
  // useSyncExternalStore uchun eng muhim shart: getSnapshot har chaqiruvda
  // yangi obyekt qaytarsa, React cheksiz render sikliga tushadi.
  it('getSnapshot takroriy chaqiruvlarda aynan bir xil havolani qaytaradi', async () => {
    localStorage.setItem('test-key', JSON.stringify({ v: 1, data: ['a', 'b'] }));
    const store = await makeStore();
    const first = store.getSnapshot();
    expect(first).toEqual(['a', 'b']);
    expect(store.getSnapshot()).toBe(first);
    expect(store.getSnapshot()).toBe(first);
  });

  it('getServerSnapshot localStorage ga qaramaydi va doim bir xil', async () => {
    localStorage.setItem('test-key', JSON.stringify({ v: 1, data: ['saqlangan'] }));
    const store = await makeStore();
    expect(store.getServerSnapshot()).toBe(EMPTY);
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
  });
});

describe('createPersistentStore — yozish', () => {
  it('set konvertga yozadi va obunachilarni aynan bir marta xabardor qiladi', async () => {
    const store = await makeStore();
    const listener = vi.fn();
    store.subscribe(listener);

    const next = ['x'];
    store.set(next);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(next);
    expect(JSON.parse(localStorage.getItem('test-key') ?? 'null')).toEqual({ v: 1, data: ['x'] });
  });

  it('funksional yangilash joriy qiymatni oladi', async () => {
    const store = await makeStore();
    store.set(['a']);
    store.set((prev) => [...prev, 'b']);
    expect(store.getSnapshot()).toEqual(['a', 'b']);
  });

  it('o\'sha havola qayta berilsa xabar bermaydi', async () => {
    const store = await makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const value = store.getSnapshot();
    store.set(value);
    expect(listener).not.toHaveBeenCalled();
  });

  it('reset kalitni o\'chiradi va standart qiymatga qaytaradi', async () => {
    const store = await makeStore();
    store.set(['a']);
    store.reset();
    expect(store.getSnapshot()).toEqual([]);
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  // Regressiya: kvota tugaganda UI ham yangilanmay qolmasligi kerak.
  it('kvota tugasa xotiradagi holat baribir yangilanadi', async () => {
    const store = await makeStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    store.set(['xotirada']);
    expect(store.getSnapshot()).toEqual(['xotirada']);
    expect(store.isDegraded()).toBe(true);
  });
});

describe('createPersistentStore — buzilgan ma\'lumot', () => {
  // Regressiya: avval 10 ta himoyalanmagan JSON.parse bor edi va bittasi
  // buzilgan qiymat butun React daraxtini yiqitardi.
  it('zaharlangan qiymatda standartga qaytadi, bir marta ogohlantiradi va uni tuzatadi', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('test-key', '{{{ buzilgan');
    const store = await makeStore();

    expect(store.getSnapshot()).toEqual([]);
    expect(store.getSnapshot()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('test-key') ?? 'null')).toEqual({ v: 1, data: [] });
  });

  it('sxemaga mos kelmaydigan qiymatda standartga qaytadi', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('test-key', JSON.stringify({ v: 1, data: { nope: 1 } }));
    const store = await makeStore();
    expect(store.getSnapshot()).toEqual([]);
  });

  it('konvertsiz eski qiymatni saqlab, yangi formatga o\'tkazadi', async () => {
    localStorage.setItem('test-key', JSON.stringify(['eski']));
    const store = await makeStore();
    expect(store.getSnapshot()).toEqual(['eski']);
    expect(JSON.parse(localStorage.getItem('test-key') ?? 'null')).toEqual({ v: 1, data: ['eski'] });
  });
});

describe('createPersistentStore — tab\'lararo sinxronizatsiya', () => {
  it('boshqa tabdagi o\'zgarishni oladi va obunachini xabardor qiladi', async () => {
    const store = await makeStore();
    store.getSnapshot();
    const listener = vi.fn();
    store.subscribe(listener);

    localStorage.setItem('test-key', JSON.stringify({ v: 1, data: ['boshqa-tab'] }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'test-key' }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual(['boshqa-tab']);
  });

  it('xom satr o\'zgarmagan bo\'lsa qayta parse qilmaydi va xabar bermaydi', async () => {
    const store = await makeStore();
    store.set(['a']);
    const snapshot = store.getSnapshot();
    const listener = vi.fn();
    store.subscribe(listener);

    window.dispatchEvent(new StorageEvent('storage', { key: 'test-key' }));

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(snapshot);
  });

  it('oxirgi obunachi ketgach tinglashni to\'xtatadi', async () => {
    const store = await makeStore();
    store.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    localStorage.setItem('test-key', JSON.stringify({ v: 1, data: ['keyin'] }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'test-key' }));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('real store migratsiyalari', () => {
  // Regressiya: eski ThemeContext mavzuni JSON'siz yozardi
  // (`localStorage.setItem('zetra-theme', 'light')`). Yangi store uni
  // "buzilgan" deb hisoblab, yorug' rejim foydalanuvchisini qorong'iga
  // qaytarib yuborardi.
  it('eski xom mavzu va til qiymatlari saqlanib qoladi', async () => {
    localStorage.setItem('zetra-theme', 'light');
    localStorage.setItem('zetra-lang', 'ru');
    const { themeStore, languageStore } = await import('./preferencesStore');
    expect(themeStore.getSnapshot()).toBe('light');
    expect(languageStore.getSnapshot()).toBe('ru');
    expect(JSON.parse(localStorage.getItem('zetra-theme') ?? 'null')).toEqual({ v: 1, data: 'light' });
  });

  // Regressiya: eski savat konvertsiz massiv edi va yangi store uni
  // tashlab yuborib, qaytib kelgan foydalanuvchining savatini bo'shatardi.
  it('eski savat saqlanib qoladi', async () => {
    const { SEED_PRODUCTS } = await import('@/data/products');
    localStorage.setItem('zetra-cart', JSON.stringify([{ ...SEED_PRODUCTS[0], quantity: 2 }]));
    const { cartStore } = await import('./cartStore');
    expect(cartStore.getSnapshot()).toHaveLength(1);
    expect(cartStore.getSnapshot()[0].quantity).toBe(2);
  });
});
