/**
 * Zetra `localStorage` kalitlarining yagona ro'yxati.
 *
 * Avval bu kalitlar 9 ta faylga sochilgan edi va ba'zilari xato yozilgan.
 * Har bir kalitning versiyasi bor — saqlangan shakl o'zgarsa, versiya oshiriladi
 * va eski qiymat migratsiya qilinadi yoki rad etiladi.
 */
export const STORAGE_KEYS = {
  cart: 'zetra-cart',
  user: 'zetra-user',
  accounts: 'zetra-accounts',
  purchases: 'zetra-purchases',
  catalog: 'zetra-catalog-overlay',
  theme: 'zetra-theme',
  language: 'zetra-lang',
  currency: 'zetra-currency',
  fxRate: 'zetra-fx-rate',
  licenseKeys: 'zetra-license-keys',
  downloadLimits: 'zetra-download-limits',
  sessions: 'zetra-sessions',
  securityLogs: 'zetra-security-logs',
  authThrottle: 'zetra-auth-throttle',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Har bir kalitning joriy sxema versiyasi. */
export const STORAGE_VERSIONS = {
  [STORAGE_KEYS.cart]: 1,
  [STORAGE_KEYS.user]: 2,
  [STORAGE_KEYS.accounts]: 1,
  [STORAGE_KEYS.purchases]: 2,
  [STORAGE_KEYS.catalog]: 1,
  [STORAGE_KEYS.theme]: 1,
  [STORAGE_KEYS.language]: 1,
  [STORAGE_KEYS.currency]: 1,
  [STORAGE_KEYS.fxRate]: 1,
  [STORAGE_KEYS.licenseKeys]: 2,
  [STORAGE_KEYS.downloadLimits]: 2,
  [STORAGE_KEYS.sessions]: 2,
  [STORAGE_KEYS.securityLogs]: 2,
  [STORAGE_KEYS.authThrottle]: 1,
} as const satisfies Record<StorageKey, number>;

/** Endi ishlatilmaydigan, migratsiyadan keyin o'chiriladigan eski kalitlar. */
export const LEGACY_STORAGE_KEYS = {
  /** Butun katalog snapshot'i. `catalog` ustqurmasi bilan almashtirildi. */
  products: 'zetra-products',
  /** Foydalanuvchiga bog'lanmagan litsenziya kalitlari. `licenseKeys` bilan almashtirildi. */
  securityKeys: 'zetra-security-keys',
} as const;

/** Append-only jurnallar uchun chegaralar. */
export const LOG_CAPS = {
  securityLogs: 200,
  sessions: 20,
} as const;
