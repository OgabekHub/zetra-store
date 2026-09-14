/**
 * Mavzu va til — ikkalasi ham saqlanadigan, tab'lar orasida sinxronlanadigan
 * afzalliklar.
 *
 * `ThemeContext` va `LanguageContext` o'z API'sini saqlab qoladi, faqat ichida
 * `useState` + `useEffect` o'rniga shu store'ni o'qiydi.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS } from './keys';
import { parseTheme, parseLanguage } from '@/schemas';

export type Theme = 'light' | 'dark';
export type Language = 'uz' | 'ru' | 'en';

export const DEFAULT_THEME: Theme = 'dark';
export const DEFAULT_LANGUAGE: Language = 'uz';

export const themeStore = createPersistentStore<Theme>({
  key: STORAGE_KEYS.theme,
  version: STORAGE_VERSIONS[STORAGE_KEYS.theme],
  fallback: () => DEFAULT_THEME,
  validate: parseTheme,
  // v1 gacha mavzu konvertsiz, xom satr sifatida saqlanardi.
  migrate: (_from, data) => parseTheme(data),
});

export const languageStore = createPersistentStore<Language>({
  key: STORAGE_KEYS.language,
  version: STORAGE_VERSIONS[STORAGE_KEYS.language],
  fallback: () => DEFAULT_LANGUAGE,
  validate: parseLanguage,
  migrate: (_from, data) => parseLanguage(data),
});

/**
 * `<html>` elementidagi mavzu klassini va `lang` atributini yangilaydi.
 *
 * `lang` avval `layout.tsx` da qat'iy `"uz"` edi va til almashtirilganda hech
 * qachon yangilanmasdi — ekran o'quvchilar noto'g'ri ovoz tanlardi, Chrome esa
 * har sahifani o'zbekcha deb bilardi.
 */
export function applyDocumentPreferences(theme: Theme, language: Language): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
  root.lang = language;
}
