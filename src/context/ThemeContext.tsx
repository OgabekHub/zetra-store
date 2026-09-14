"use client";

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { usePersistentStore } from '@/store/usePersistentStore';
import { themeStore, type Theme } from '@/store/preferencesStore';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Avval bu yerda `useState('dark')` + `useEffect` bor edi, ya'ni birinchi
  // render har doim qorong'i bo'lardi va `react-hooks/set-state-in-effect`
  // xatosi chiqardi. Endi store'dan o'qiladi; birinchi bo'yashdagi klassni
  // esa `layout.tsx` dagi bloklovchi skript qo'yadi.
  const theme = usePersistentStore(themeStore);

  const setTheme = useCallback((next: Theme) => {
    themeStore.set(next);
  }, []);

  const toggleTheme = useCallback(() => {
    themeStore.set((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // React holatini tashqi tizim (DOM) bilan sinxronlash — effektning aynan
  // o'z vazifasi. Boshqa tabda o'zgarganda ham shu yerdan qo'llanadi.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
