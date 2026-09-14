import { describe, expect, it, vi } from 'vitest';
import type { CartItem, Product } from '@/types';

async function seed() {
  const { SEED_PRODUCTS } = await import('@/data/products');
  return SEED_PRODUCTS;
}

function asCartItem(product: Product, quantity: number): CartItem {
  return { ...product, quantity };
}

describe('catalogStore', () => {
  it('standart holatda fixture katalogini beradi', async () => {
    const products = await seed();
    const { getCatalog } = await import('./catalogStore');
    expect(getCatalog()).toHaveLength(products.length);
  });

  it('sotuvchi mahsulotini boshiga qo\'shadi va origin=local qiladi', async () => {
    const products = await seed();
    const { addProduct, getCatalog, getProductById } = await import('./catalogStore');
    addProduct({ ...products[0], id: 90001, title: 'Yangi' });
    expect(getCatalog()[0].id).toBe(90001);
    expect(getProductById(90001)?.origin).toBe('local');
  });

  // Regressiya: avval butun katalog snapshot qilib yozilardi, shuning uchun
  // fixture'ga kiritilgan keyingi o'zgarishlar foydalanuvchiga ko'rinmasdi.
  it('localStorage ga faqat farq yoziladi, fixture nusxasi emas', async () => {
    const products = await seed();
    const { addProduct } = await import('./catalogStore');
    addProduct({ ...products[0], id: 90002, title: 'Sotuvchi mahsuloti' });
    const stored = localStorage.getItem('zetra-catalog-overlay') ?? '';
    expect(stored).toContain('Sotuvchi mahsuloti');
    expect(stored).not.toContain(products[1].title);
  });

  it('fixture mahsulotini yashiradi, qayta o\'chirish holatni o\'zgartirmaydi', async () => {
    const products = await seed();
    const { deleteProduct, getProductById, catalogStore } = await import('./catalogStore');
    const target = products[2].id;
    deleteProduct(target);
    const snapshot = catalogStore.getSnapshot();
    deleteProduct(target);
    expect(getProductById(target)).toBeUndefined();
    expect(catalogStore.getSnapshot()).toBe(snapshot);
  });

  it('sotuvchi mahsulotini butunlay olib tashlaydi', async () => {
    const products = await seed();
    const { addProduct, deleteProduct, catalogStore } = await import('./catalogStore');
    addProduct({ ...products[0], id: 90003 });
    deleteProduct(90003);
    expect(catalogStore.getSnapshot().custom).toHaveLength(0);
    const snapshot = catalogStore.getSnapshot();
    deleteProduct(123456789);
    expect(catalogStore.getSnapshot()).toBe(snapshot);
  });

  it('nextProductId mavjud id lardan katta', async () => {
    const products = await seed();
    const { nextProductId } = await import('./catalogStore');
    const max = Math.max(...products.map((p) => p.id));
    expect(nextProductId()).toBeGreaterThan(max);
  });

  it('eski zetra-products snapshot\'ini ustqurmaga o\'tkazadi', async () => {
    const products = await seed();
    const removed = products[2].id;
    const legacy = [
      { ...products[0], id: 777777, title: 'Eski sotuvchi mahsuloti' },
      ...products.filter((p) => p.id !== removed),
    ];
    localStorage.setItem('zetra-products', JSON.stringify(legacy));

    const { migrateLegacyCatalog, catalogStore } = await import('./catalogStore');
    migrateLegacyCatalog();

    const overlay = catalogStore.getSnapshot();
    expect(overlay.custom.map((p) => p.id)).toEqual([777777]);
    expect(overlay.custom[0].origin).toBe('local');
    expect(overlay.hiddenSeedIds).toEqual([removed]);
    expect(localStorage.getItem('zetra-products')).toBeNull();
  });

  it('buzilgan eski snapshot\'ni jimgina o\'chiradi', async () => {
    localStorage.setItem('zetra-products', '{{{');
    const { migrateLegacyCatalog, getCatalog } = await import('./catalogStore');
    const before = getCatalog().length;
    migrateLegacyCatalog();
    expect(localStorage.getItem('zetra-products')).toBeNull();
    expect(getCatalog()).toHaveLength(before);
  });
});

describe('cartStore', () => {
  it('qo\'shish, miqdor va o\'chirish', async () => {
    const products = await seed();
    const { addItem, setQuantity, removeItem, clear, cartStore, countItems, subtotal } = await import('./cartStore');

    addItem(products[0]);
    addItem(products[0]);
    addItem(products[1]);
    expect(countItems(cartStore.getSnapshot())).toBe(3);

    setQuantity(products[1].id, 5);
    expect(cartStore.getSnapshot().find((i) => i.id === products[1].id)?.quantity).toBe(5);

    setQuantity(products[1].id, 0);
    expect(cartStore.getSnapshot()).toHaveLength(1);

    removeItem(products[0].id);
    expect(cartStore.getSnapshot()).toHaveLength(0);

    addItem(products[0]);
    clear();
    expect(cartStore.getSnapshot()).toEqual([]);
    expect(subtotal([asCartItem({ ...products[0], price: 24.99 }, 5)])).toBe(124.95);
  });
});

describe('purchaseStore', () => {
  it('bo\'sh savatdan buyurtma yaratmaydi', async () => {
    const { recordPurchase } = await import('./purchaseStore');
    expect(recordPurchase('u1', [])).toBeNull();
  });

  // Regressiya: avval `quantity` tashlab yuborilardi — 3 tasiga pul olinib,
  // bitta yozuv berilardi.
  it('miqdorni saqlaydi va jamini to\'g\'ri yaxlitlaydi', async () => {
    const products = await seed();
    const { recordPurchase, purchasesFor } = await import('./purchaseStore');
    const purchase = recordPurchase('u1', [
      asCartItem({ ...products[0], price: 24.99 }, 5),
      asCartItem({ ...products[1], price: 19 }, 1),
    ]);

    expect(purchase?.id).toMatch(/^ZTR-\d{6}$/);
    expect(purchase?.lines.map((l) => l.quantity)).toEqual([5, 1]);
    expect(purchase?.total).toBe(143.95);
    expect(purchasesFor('u1')).toHaveLength(1);
  });

  // Regressiya: `zetra-purchases` egasiz umumiy ro'yxat edi.
  it('xaridlar faqat o\'z egasiga ko\'rinadi', async () => {
    const products = await seed();
    const { recordPurchase, purchasesFor } = await import('./purchaseStore');
    recordPurchase('alice', [asCartItem(products[0], 1)]);
    expect(purchasesFor('bob')).toEqual([]);
    expect(purchasesFor(null)).toEqual([]);
    expect(purchasesFor('alice')).toHaveLength(1);
  });

  it('yuklab olish chegarasi foydalanuvchiga bog\'langan va noldan pastga tushmaydi', async () => {
    const products = await seed();
    const { recordPurchase, consumeDownload, getDownloadsLeft, DOWNLOADS_PER_PURCHASE } = await import(
      './purchaseStore'
    );
    const id = products[0].id;
    recordPurchase('alice', [asCartItem(products[0], 1)]);

    expect(getDownloadsLeft('alice', id)).toBe(DOWNLOADS_PER_PURCHASE);
    for (let i = 0; i < DOWNLOADS_PER_PURCHASE + 3; i++) consumeDownload('alice', id);
    expect(getDownloadsLeft('alice', id)).toBe(0);
    expect(getDownloadsLeft('bob', id)).toBe(DOWNLOADS_PER_PURCHASE);
  });

  it('qayta sotib olish yuklab olish hisoblagichini tiklamaydi', async () => {
    const products = await seed();
    const { recordPurchase, consumeDownload, getDownloadsLeft } = await import('./purchaseStore');
    const id = products[0].id;
    recordPurchase('alice', [asCartItem(products[0], 1)]);
    consumeDownload('alice', id);
    recordPurchase('alice', [asCartItem(products[0], 1)]);
    expect(getDownloadsLeft('alice', id)).toBe(4);
  });

  // Regressiya: kalitlar faqat product.id bo'yicha saqlanardi va umumiy
  // brauzerda boshqa foydalanuvchining kaliti ko'rinardi.
  it('litsenziya kalitlari foydalanuvchilar orasida ajratilgan', async () => {
    const { setLicenseKeys, getLicenseKeys } = await import('./purchaseStore');
    setLicenseKeys('alice', 1, { license: 'L-A', decrypt: 'D-A' });
    expect(getLicenseKeys('alice', 1)).toEqual({ license: 'L-A', decrypt: 'D-A' });
    expect(getLicenseKeys('bob', 1)).toBeUndefined();
  });

  it('sahifa qayta yuklangach xaridlar saqlanib qoladi', async () => {
    const products = await seed();
    const first = await import('./purchaseStore');
    first.recordPurchase('alice', [asCartItem(products[0], 2)]);

    vi.resetModules();
    const second = await import('./purchaseStore');
    expect(second.purchasesFor('alice')[0].lines[0].quantity).toBe(2);
  });
});

describe('authStore va accountsStore', () => {
  it('kirishda barqaror id beradi, email katta-kichik harfga sezgir emas', async () => {
    const { login } = await import('./authStore');
    const first = login('Ali', 'Ali@Mail.uz');
    const second = login('Ali', 'ali@mail.uz');
    expect(first.id).toBeTruthy();
    expect(second.id).toBe(first.id);
  });

  // Regressiya: huquqlar o'zgaruvchan email'ga bog'langan edi, email'ni
  // o'zgartirish yuklab olish hisoblagichini tiklardi.
  it('email o\'zgarganda id saqlanadi', async () => {
    const { login, updateProfile, logout } = await import('./authStore');
    const { accountsStore } = await import('./accountsStore');
    const original = login('Ali', 'ali@mail.uz');

    const updated = updateProfile('Ali Valiyev', 'ali.valiyev@mail.uz');
    expect(updated.ok && updated.profile.id).toBe(original.id);
    expect(Object.keys(accountsStore.getSnapshot())).toEqual(['ali.valiyev@mail.uz']);

    logout();
    expect(login('Ali', 'ali.valiyev@mail.uz').id).toBe(original.id);
    expect(login('Boshqa', 'ali@mail.uz').id).not.toBe(original.id);
  });

  it('tizimdan chiqqanda updateProfile hech narsa qilmaydi', async () => {
    const { updateProfile, getCurrentUser } = await import('./authStore');
    expect(updateProfile('X', 'x@mail.uz')).toEqual({ ok: false, reason: 'logged-out' });
    expect(getCurrentUser()).toBeNull();
  });

  it('eski {name, email} formatidagi foydalanuvchini id bilan migratsiya qiladi', async () => {
    localStorage.setItem('zetra-user', JSON.stringify({ name: 'Ali', email: 'ali@mail.uz' }));
    const { getCurrentUser } = await import('./authStore');
    const user = getCurrentUser();
    expect(user?.email).toBe('ali@mail.uz');
    expect(user?.id).toBeTruthy();
  });

  it('buzilgan foydalanuvchi yozuvida yiqilmaydi', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('zetra-user', JSON.stringify({ v: 2, data: { user: { nam: 'x' } } }));
    const { getCurrentUser } = await import('./authStore');
    expect(getCurrentUser()).toBeNull();
  });
});

describe('securityStore', () => {
  // Regressiya: avval yangi seans BARCHA foydalanuvchilarning seanslarini
  // isCurrent: false qilardi.
  it('yangi seans faqat o\'sha foydalanuvchining eski seanslarini joriy emas qiladi', async () => {
    const { createSession, sessionsStore, sessionsFor } = await import('./securityStore');
    createSession('bob@mail.uz');
    createSession('alice@mail.uz');
    createSession('alice@mail.uz');

    const all = sessionsStore.getSnapshot();
    expect(sessionsFor(all, 'bob@mail.uz').map((s) => s.isCurrent)).toEqual([true]);
    expect(sessionsFor(all, 'alice@mail.uz').map((s) => s.isCurrent)).toEqual([true, false]);
  });

  it('boshqa seanslarni tugatish boshqa foydalanuvchilarga tegmaydi', async () => {
    const { createSession, revokeOtherSessions, sessionsStore, sessionsFor } = await import('./securityStore');
    createSession('bob@mail.uz');
    createSession('alice@mail.uz');
    createSession('alice@mail.uz');
    revokeOtherSessions('alice@mail.uz');

    const all = sessionsStore.getSnapshot();
    expect(sessionsFor(all, 'alice@mail.uz')).toHaveLength(1);
    expect(sessionsFor(all, 'bob@mail.uz')).toHaveLength(1);
  });

  // Regressiya: jurnallar cheksiz o'sardi.
  it('seanslar va jurnallar chegaralangan', async () => {
    const { createSession, logSecurityEvent, sessionsStore, securityLogsStore } = await import('./securityStore');
    const { LOG_CAPS } = await import('./keys');
    for (let i = 0; i < LOG_CAPS.sessions + 5; i++) createSession(`u${i}@mail.uz`);
    for (let i = 0; i < LOG_CAPS.securityLogs + 10; i++) logSecurityEvent('a@mail.uz', `hodisa ${i}`);

    expect(sessionsStore.getSnapshot()).toHaveLength(LOG_CAPS.sessions);
    expect(securityLogsStore.getSnapshot()).toHaveLength(LOG_CAPS.securityLogs);
    expect(securityLogsStore.getSnapshot()[0].event).toBe(`hodisa ${LOG_CAPS.securityLogs + 9}`);
  });

  it('buzilgan qatorni alohida tashlaydi, butun tarixni emas', async () => {
    const good = {
      id: 'SES-1',
      email: 'a@mail.uz',
      device: 'Chrome',
      ip: '1.1.1.1',
      lastActive: '2026-09-14T00:00:00.000Z',
      isCurrent: true,
    };
    localStorage.setItem('zetra-sessions', JSON.stringify({ v: 2, data: [good, { bad: 1 }] }));
    const { sessionsStore } = await import('./securityStore');
    expect(sessionsStore.getSnapshot()).toEqual([good]);
  });

  it('email berilmasa bo\'sh ro\'yxat', async () => {
    const { sessionsFor, logsFor } = await import('./securityStore');
    expect(sessionsFor([], undefined)).toEqual([]);
    expect(logsFor([], undefined)).toEqual([]);
  });
});

describe('currencyStore', () => {
  function mockFetch(body: unknown, ok = true) {
    const fetchMock = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  // Regressiya: valyuta tanlovi saqlanmasdi va sahifa almashganda USD ga qaytardi.
  it('tanlangan valyuta qayta yuklangach saqlanadi', async () => {
    const first = await import('./currencyStore');
    first.setCurrency('UZS');
    vi.resetModules();
    const second = await import('./currencyStore');
    expect(second.currencyStore.getSnapshot()).toBe('UZS');
  });

  it('yaroqli kursni saqlaydi', async () => {
    const fetchMock = mockFetch({ rates: { UZS: 13000 } });
    const { ensureExchangeRate, getExchangeRate } = await import('./currencyStore');
    await ensureExchangeRate();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getExchangeRate()).toBe(13000);
  });

  it('kesh yangi bo\'lsa qayta so\'ramaydi, parallel chaqiruvlar bitta so\'rov', async () => {
    const fetchMock = mockFetch({ rates: { UZS: 13000 } });
    const { ensureExchangeRate } = await import('./currencyStore');
    await Promise.all([ensureExchangeRate(), ensureExchangeRate(), ensureExchangeRate()]);
    await ensureExchangeRate();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('eskirgan keshda qayta so\'raydi', async () => {
    localStorage.setItem(
      'zetra-fx-rate',
      JSON.stringify({ v: 1, data: { rate: 12000, fetchedAt: new Date(Date.now() - 7 * 3600_000).toISOString() } }),
    );
    const fetchMock = mockFetch({ rates: { UZS: 13100 } });
    const { ensureExchangeRate, getExchangeRate } = await import('./currencyStore');
    await ensureExchangeRate();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getExchangeRate()).toBe(13100);
  });

  // Regressiya: javob tekshirilmasdi va sonsiz qiymat butun sayt bo'ylab
  // "NaN so'm" ko'rsatardi.
  it.each([
    ['sonsiz', { rates: { UZS: 'n/a' } }],
    ['diapazondan tashqari', { rates: { UZS: 50 } }],
    ['rates yo\'q', {}],
    ['null', null],
  ])('%s javobda zaxira kurs qoladi', async (_label, body) => {
    mockFetch(body);
    const { ensureExchangeRate, getExchangeRate, FALLBACK_RATE } = await import('./currencyStore');
    await ensureExchangeRate();
    expect(getExchangeRate()).toBe(FALLBACK_RATE);
  });

  it('tarmoq xatosi yoki 500 javobida istisno tashlamaydi', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    const failing = await import('./currencyStore');
    await expect(failing.ensureExchangeRate()).resolves.toBeUndefined();
    expect(failing.getExchangeRate()).toBe(failing.FALLBACK_RATE);

    vi.resetModules();
    localStorage.clear();
    mockFetch({ rates: { UZS: 13000 } }, false);
    const serverError = await import('./currencyStore');
    await serverError.ensureExchangeRate();
    expect(serverError.getExchangeRate()).toBe(serverError.FALLBACK_RATE);
  });
});
