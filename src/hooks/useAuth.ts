"use client";

import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { usePersistentStore } from '@/store/usePersistentStore';
import {
  authStore,
  login as loginUser,
  logout as logoutUser,
  updateProfile as updateUserProfile,
} from '@/store/authStore';
import { purchasesStore, recordPurchase } from '@/store/purchaseStore';
import { useLanguage } from '@/context/LanguageContext';
import { uiStore, useUiState } from '@/store/uiStore';
import type { CartItem, Product, Purchase } from '@/types';

export function useAuth() {
  const { t } = useLanguage();
  const authState = usePersistentStore(authStore);
  const allPurchases = usePersistentStore(purchasesStore);
  const { isAuthOpen } = useUiState();

  const setIsAuthOpen = useCallback((open: boolean) => {
    uiStore.set({ isAuthOpen: open });
  }, []);

  const currentUser = authState.user;

  /** Faqat shu foydalanuvchining xaridlari. Avval ro'yxat hamma uchun umumiy edi. */
  const purchases: Purchase[] = useMemo(
    () => (currentUser ? allPurchases.filter((p) => p.userId === currentUser.id) : []),
    [allPurchases, currentUser],
  );

  /**
   * Eski komponentlar hali `Product[]` kutadi. Ro'yxat eng yangi xariddan
   * boshlanadi va bir mahsulot bir marta ko'rsatiladi.
   */
  const purchasedProducts: Product[] = useMemo(() => {
    const seen = new Set<number>();
    const out: Product[] = [];
    for (const purchase of purchases) {
      for (const line of purchase.lines) {
        if (seen.has(line.productId)) continue;
        seen.add(line.productId);
        out.push(line.product);
      }
    }
    return out;
  }, [purchases]);

  const login = useCallback((name: string, email: string) => {
    loginUser(name, email);
  }, []);

  const logout = useCallback(() => {
    // Xaridlar o'chirilmaydi — ular `userId` ga bog'langan, shuning uchun
    // qayta kirganda joyida turadi. Avval `logout()` ularni hamma uchun
    // yo'q qilardi.
    logoutUser();
    toast.success(t('auth_logout_success'), { icon: '👋' });
  }, [t]);

  // Natija qaytariladi: boshqa hisobga tegishli email rad etilganini UI
  // foydalanuvchiga ko'rsatishi kerak.
  const updateProfile = useCallback(
    (name: string, email: string) => updateUserProfile(name, email),
    [],
  );

  /** Savat qatorlarini, miqdori bilan birga, xaridga aylantiradi. */
  const addPurchases = useCallback(
    (items: CartItem[]): Purchase | null => {
      if (!currentUser) return null;
      return recordPurchase(currentUser.id, items);
    },
    [currentUser],
  );

  return {
    currentUser,
    isAuthOpen,
    setIsAuthOpen,
    purchases,
    purchasedProducts,
    login,
    logout,
    updateProfile,
    addPurchases,
  };
}
