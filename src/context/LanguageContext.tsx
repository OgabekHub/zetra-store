"use client";

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { translations } from '@/utils/translations';
import { usePersistentStore } from '@/store/usePersistentStore';
import { languageStore, type Language } from '@/store/preferencesStore';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = usePersistentStore(languageStore);

  const setLanguage = useCallback((lang: Language) => {
    languageStore.set(lang);
  }, []);

  // Tarjima funksiyasi faqat til o'zgarganda qayta yaratiladi. Avval u har
  // renderda yangi bo'lardi va 12 ta iste'molchini keraksiz qayta render
  // qilardi — loyihada `useMemo` umuman ishlatilmagan edi.
  const t = useMemo(() => {
    const table = translations[language];
    return (key: string): string => table?.[key] ?? key;
  }, [language]);

  // `<html lang>` avval `layout.tsx` da qat'iy "uz" edi va hech qachon
  // yangilanmasdi: ekran o'quvchilar noto'g'ri ovoz tanlardi va Chrome har
  // sahifani o'zbekchadan tarjima qilishni taklif qilardi.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
