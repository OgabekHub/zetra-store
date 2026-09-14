/**
 * Katalog.
 *
 * Avval butun katalog `zetra-products` ga snapshot qilib yozilardi. Oqibati:
 * foydalanuvchi saytga bir marta kirgach, `src/data/products.ts` ga kiritilgan
 * har qanday keyingi o'zgarish unga **abadiy** ko'rinmay qolardi — versiya
 * kaliti ham, merge ham, TTL ham yo'q edi.
 *
 * Endi faqat farq saqlanadi: sotuvchi qo'shgan mahsulotlar va foydalanuvchi
 * o'chirgan fixture id lari. Katalogning o'zi har safar fixture ustiga shu
 * farqni qo'yish orqali hosil qilinadi, shuning uchun fixture tahrirlari
 * darhol ko'rinadi.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS, LEGACY_STORAGE_KEYS } from './keys';
import { parseCatalogOverlay, parseProduct } from '@/schemas';
import { readRaw, removeKey } from './storage';
import { parseArrayOf } from '@/utils/guards';
import { SEED_PRODUCTS } from '@/data/products';
import type { CatalogOverlay, Product } from '@/types';

const EMPTY_OVERLAY: CatalogOverlay = { custom: [], hiddenSeedIds: [] };

const SEED_IDS = new Set(SEED_PRODUCTS.map((p) => p.id));

export const catalogStore = createPersistentStore<CatalogOverlay>({
  key: STORAGE_KEYS.catalog,
  version: STORAGE_VERSIONS[STORAGE_KEYS.catalog],
  fallback: () => EMPTY_OVERLAY,
  validate: parseCatalogOverlay,
});

/** Fixture ustiga ustqurmani qo'yib, to'liq katalogni beradi. */
export function deriveCatalog(overlay: CatalogOverlay): Product[] {
  const hidden = new Set(overlay.hiddenSeedIds);
  const seed = SEED_PRODUCTS.filter((p) => !hidden.has(p.id));
  return [...overlay.custom, ...seed];
}

export function getCatalog(): Product[] {
  return deriveCatalog(catalogStore.getSnapshot());
}

export function getProductById(id: number): Product | undefined {
  return getCatalog().find((p) => p.id === id);
}

export function addProduct(product: Product): void {
  catalogStore.set((prev) => ({
    ...prev,
    custom: [{ ...product, origin: 'local' }, ...prev.custom],
  }));
}

/**
 * Mahsulotni o'chiradi.
 * Sotuvchi qo'shgani ro'yxatdan chiqadi; fixture mahsuloti esa yashirilganlar
 * ro'yxatiga qo'shiladi, shunda fixture o'zi buzilmaydi.
 */
export function deleteProduct(id: number): void {
  catalogStore.set((prev) => {
    if (SEED_IDS.has(id)) {
      if (prev.hiddenSeedIds.includes(id)) return prev;
      return { ...prev, hiddenSeedIds: [...prev.hiddenSeedIds, id] };
    }
    const custom = prev.custom.filter((p) => p.id !== id);
    if (custom.length === prev.custom.length) return prev;
    return { ...prev, custom };
  });
}

/** Yangi mahsulot uchun to'qnashmaydigan id. */
export function nextProductId(): number {
  const catalog = getCatalog();
  const max = catalog.reduce((acc, p) => (p.id > acc ? p.id : acc), 0);
  return Math.max(max + 1, Date.now() % 1_000_000_000);
}

/**
 * Eski `zetra-products` snapshot'ini bir marta ustqurmaga o'tkazadi.
 *
 * Fixture'da yo'q id lar — sotuvchi qo'shgan mahsulotlar.
 * Saqlangan ro'yxatda yo'q fixture id lari — foydalanuvchi o'chirganlari.
 */
export function migrateLegacyCatalog(): void {
  const raw = readRaw(LEGACY_STORAGE_KEYS.products);
  if (raw === null) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    removeKey(LEGACY_STORAGE_KEYS.products);
    return;
  }

  const saved = parseArrayOf(parsed, parseProduct, true);
  if (saved === null) {
    removeKey(LEGACY_STORAGE_KEYS.products);
    return;
  }

  const savedIds = new Set(saved.map((p) => p.id));
  const custom = saved
    .filter((p) => !SEED_IDS.has(p.id))
    .map<Product>((p) => ({ ...p, origin: 'local' }));
  const hiddenSeedIds = SEED_PRODUCTS.filter((p) => !savedIds.has(p.id)).map((p) => p.id);

  catalogStore.set({ custom, hiddenSeedIds });
  removeKey(LEGACY_STORAGE_KEYS.products);
}
