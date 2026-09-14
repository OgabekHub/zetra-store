/**
 * Zetra — loyihadagi barcha umumiy tiplar shu yerda.
 *
 * Avval `Product` fixture faylida (`src/data/products.ts`) yashardi va 11 ta
 * modul tipni fixture'dan import qilardi; `Currency` 10 ta joyda qayta
 * e'lon qilingan edi; `Session` va `SecurityLog` esa umuman `any[]` edi.
 * Endi bitta manba.
 */

/** Saytda qo'llab-quvvatlanadigan valyutalar. */
export type Currency = 'USD' | 'UZS';

/** Mahsulot qayerdan kelgan: fixture'dan ("seed") yoki sotuvchi qo'shgan ("local"). */
export type ProductOrigin = 'seed' | 'local';

export interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  /** Chegirmagacha bo'lgan narx. Mavjud bo'lsa, kartada chizilgan narx ko'rsatiladi. */
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  author: string;
  description: string;
  fileSize: string;
  fileType: string;
  features: string[];
  /** Mahsulot qo'shilgan vaqt (ISO string). Tartiblash uchun. */
  createdAt?: string;
  /** Mahsulot "Yangi" deb belgilansinmi? */
  isNew?: boolean;
  /** Fixture'dan kelganmi yoki sotuvchi qo'shganmi. Belgilanmagan bo'lsa 'seed' deb qaraladi. */
  origin?: ProductOrigin;
}

export interface CartItem extends Product {
  quantity: number;
}

/**
 * localStorage da saqlanadigan katalog ustqurmasi.
 *
 * Avval butun katalog `zetra-products` ga snapshot qilib yozilardi, shuning
 * uchun `src/data/products.ts` ga kiritilgan har qanday keyingi o'zgarish
 * foydalanuvchiga abadiy ko'rinmay qolardi. Endi faqat farq saqlanadi.
 */
export interface CatalogOverlay {
  /** Sotuvchi qo'shgan mahsulotlar. */
  custom: Product[];
  /** Foydalanuvchi o'chirgan fixture mahsulotlarining id lari. */
  hiddenSeedIds: number[];
}

/** Barqaror hisob yozuvi (`zetra-accounts`). Email o'zgarsa ham `id` o'zgarmaydi. */
export interface Account {
  id: string;
  email: string;
  name: string;
  /** ISO string. */
  createdAt: string;
  /**
   * Parol xeshi. Ijtimoiy kirish orqali yaratilgan yoki eski hisoblarda yo'q.
   * Ochiq parol hech qachon saqlanmaydi.
   */
  password?: PasswordHash;
}

/** PBKDF2-HMAC-SHA256 parol xeshi (`@/lib/password`). */
export interface PasswordHash {
  algorithm: 'PBKDF2-SHA256';
  iterations: number;
  /** Base64. */
  salt: string;
  /** Base64. */
  hash: string;
}

/** Bitta email bo'yicha muvaffaqiyatsiz kirish urinishlari (`zetra-auth-throttle`). */
export interface LoginThrottleEntry {
  failures: number;
  /** Epoch ms. */
  firstFailureAt: number;
  /** Epoch ms yoki bloklanmagan bo'lsa `null`. */
  lockedUntil: number | null;
}

export interface UserProfile {
  /** Barqaror identifikator. Huquqlar (yuklab olish chegarasi, litsenziya kaliti) shunga bog'lanadi. */
  id: string;
  name: string;
  email: string;
}

/** Xavfsizlik jurnalidagi yozuv holati. */
export type SecurityLogStatus = 'success' | 'failed' | 'warning';

/** Faol seans yozuvi (`zetra-sessions`). */
export interface Session {
  id: string;
  email: string;
  device: string;
  ip: string;
  /** ISO string. */
  lastActive: string;
  isCurrent: boolean;
}

/** Xavfsizlik jurnali yozuvi (`zetra-security-logs`). */
export interface SecurityLog {
  id: string;
  email: string;
  event: string;
  ip: string;
  device: string;
  /** ISO string. */
  date: string;
  status: SecurityLogStatus;
}

/** Mahsulotga biriktirilgan litsenziya va shifr kalitlari. */
export interface SecurityKeys {
  license: string;
  decrypt: string;
}

/** Buyurtmadagi bitta qator. Miqdor shu yerda saqlanadi. */
export interface PurchaseLine {
  productId: number;
  quantity: number;
  /** Xarid paytidagi dona narxi (USD). */
  unitPrice: number;
  /** Mahsulotning xarid paytidagi nusxasi, katalog o'zgarsa ham xaridlar ro'yxati buzilmasligi uchun. */
  product: Product;
}

/** Yakunlangan buyurtma (`zetra-purchases`). Foydalanuvchiga `userId` orqali bog'lanadi. */
export interface Purchase {
  /** Kvitansiyada ko'rsatiladigan raqam, masalan `ZTR-482910`. */
  id: string;
  userId: string;
  lines: PurchaseLine[];
  /** Buyurtma jami summasi (USD). */
  total: number;
  /** ISO string. */
  purchasedAt: string;
}
