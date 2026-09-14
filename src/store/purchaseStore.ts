/**
 * Xaridlar, yuklab olish chegaralari va litsenziya kalitlari.
 *
 * Uchala ma'lumot ham foydalanuvchining barqaror `id` siga bog'lanadi:
 *  - Avval `zetra-purchases` umumiy, egasiz yassi massiv edi — foydalanuvchi B
 *    foydalanuvchi A ning xaridlarini ko'rardi, `logout()` esa hammaniki uchun
 *    o'chirardi.
 *  - Yuklab olish chegarasi o'zgaruvchan email'ga bog'langan edi.
 *  - Litsenziya kalitlari faqat `product.id` bo'yicha kalitlangan edi, ya'ni
 *    umumiy brauzerda boshqa odamning kaliti o'z kaliting sifatida ko'rinardi.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS } from './keys';
import { parsePurchases, parseDownloadLimits, parseSecurityKeyMap } from '@/schemas';
import type { Purchase, PurchaseLine, CartItem, SecurityKeys } from '@/types';

/** Bitta xarid uchun beriladigan yuklab olish soni. */
export const DOWNLOADS_PER_PURCHASE = 5;

const EMPTY_PURCHASES: Purchase[] = [];
const EMPTY_LIMITS: Record<string, number> = {};
const EMPTY_KEYS: Record<string, SecurityKeys> = {};

export const purchasesStore = createPersistentStore<Purchase[]>({
  key: STORAGE_KEYS.purchases,
  version: STORAGE_VERSIONS[STORAGE_KEYS.purchases],
  fallback: () => EMPTY_PURCHASES,
  validate: parsePurchases,
});

export const downloadLimitsStore = createPersistentStore<Record<string, number>>({
  key: STORAGE_KEYS.downloadLimits,
  version: STORAGE_VERSIONS[STORAGE_KEYS.downloadLimits],
  fallback: () => EMPTY_LIMITS,
  validate: parseDownloadLimits,
});

export const licenseKeysStore = createPersistentStore<Record<string, SecurityKeys>>({
  key: STORAGE_KEYS.licenseKeys,
  version: STORAGE_VERSIONS[STORAGE_KEYS.licenseKeys],
  fallback: () => EMPTY_KEYS,
  validate: parseSecurityKeyMap,
});

/** Huquq kaliti: barqaror `userId`, o'zgaruvchan email emas. */
export function entitlementKey(userId: string, productId: number): string {
  return `${userId}:${productId}`;
}

export function purchasesFor(userId: string | null | undefined): Purchase[] {
  if (!userId) return EMPTY_PURCHASES;
  return purchasesStore.getSnapshot().filter((p) => p.userId === userId);
}

function createInvoiceId(): string {
  return `ZTR-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Savatdan buyurtma yaratadi.
 *
 * Miqdor saqlanadi — avval `page.tsx` savat qatorlaridan `quantity` ni
 * tashlab yuborardi, shuning uchun 3 ta litsenziya sotib olgan foydalanuvchi
 * 3 tasiga pul to'lab, bitta yozuv va bitta yuklab olish huquqini olardi.
 */
export function recordPurchase(userId: string, items: CartItem[]): Purchase | null {
  if (items.length === 0) return null;

  const lines: PurchaseLine[] = items.map((item) => {
    const { quantity, ...product } = item;
    return { productId: item.id, quantity, unitPrice: item.price, product };
  });

  const total = lines.reduce(
    (sum, line) => sum + Math.round(line.unitPrice * line.quantity * 100) / 100,
    0,
  );

  const purchase: Purchase = {
    id: createInvoiceId(),
    userId,
    lines,
    total: Math.round(total * 100) / 100,
    purchasedAt: new Date().toISOString(),
  };

  purchasesStore.set((prev) => [purchase, ...prev]);

  // Har bir qator uchun yuklab olish huquqi ochiladi.
  downloadLimitsStore.set((prev) => {
    const next = { ...prev };
    for (const line of lines) {
      const key = entitlementKey(userId, line.productId);
      if (next[key] === undefined) next[key] = DOWNLOADS_PER_PURCHASE;
    }
    return next;
  });

  return purchase;
}

export function getDownloadsLeft(userId: string, productId: number): number {
  const key = entitlementKey(userId, productId);
  return downloadLimitsStore.getSnapshot()[key] ?? DOWNLOADS_PER_PURCHASE;
}

/** Hisoblagichni bittaga kamaytiradi. Funksional yangilash — eskirgan closure yo'q. */
export function consumeDownload(userId: string, productId: number): void {
  const key = entitlementKey(userId, productId);
  downloadLimitsStore.set((prev) => {
    const left = prev[key] ?? DOWNLOADS_PER_PURCHASE;
    if (left <= 0) return prev;
    return { ...prev, [key]: left - 1 };
  });
}

export function getLicenseKeys(userId: string, productId: number): SecurityKeys | undefined {
  return licenseKeysStore.getSnapshot()[entitlementKey(userId, productId)];
}

export function setLicenseKeys(userId: string, productId: number, keys: SecurityKeys): void {
  const key = entitlementKey(userId, productId);
  licenseKeysStore.set((prev) => ({ ...prev, [key]: keys }));
}
