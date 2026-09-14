import type { Language } from '@/store/preferencesStore';

/**
 * `Intl` uchun lokal teglari.
 *
 * Bular tarjima kaliti EMAS — ular sana va son formatlash uchun ishlatiladi.
 * Agar ular `translations.ts` ga ko'chirilsa, sana formatlash buziladi.
 */
export const LOCALE_TAG: Record<Language, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

export function formatDateTime(value: string | number | Date, language: Language): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(LOCALE_TAG[language], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: string | number | Date, language: Language): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(LOCALE_TAG[language]);
}

/**
 * Uch tildagi qiymatlardan joriy tilnikini tanlaydi.
 * Inline `language === 'uz' ? ... : ...` o'rniga ishlatiladi — u ESLint
 * tomonidan taqiqlangan, chunki uch tarmoqli ternary'lar bir tilni jimgina
 * tashlab ketishga moyil edi.
 */
export function pickLocalized<T>(language: Language, values: Record<Language, T>): T {
  return values[language];
}
