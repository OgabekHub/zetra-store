"use client";

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types';
import { Product } from '@/data/products';
import toast from 'react-hot-toast';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<Product[]>([]);

  // localStorage dan yuklash
  useEffect(() => {
    const savedUser = localStorage.getItem('zetra-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        // xato bo'lsa null
      }
    }

    const savedPurchases = localStorage.getItem('zetra-purchases');
    if (savedPurchases) {
      try {
        setPurchasedProducts(JSON.parse(savedPurchases));
      } catch {
        // xato bo'lsa bo'sh
      }
    }
    setIsInitialized(true);
  }, []);

  // localStorage ga saqlash
  useEffect(() => {
    if (!isInitialized) return;
    if (currentUser) {
      localStorage.setItem('zetra-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('zetra-user');
    }
  }, [currentUser, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('zetra-purchases', JSON.stringify(purchasedProducts));
    }
  }, [purchasedProducts, isInitialized]);

  const login = useCallback((name: string, email: string) => {
    setCurrentUser({ name, email });
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setPurchasedProducts([]);
    localStorage.removeItem('zetra-purchases');
    toast.success("Tizimdan muvaffaqiyatli chiqdingiz!", { icon: '👋' });
  }, []);

  const updateProfile = useCallback((name: string, email: string) => {
    setCurrentUser((prev) => (prev ? { ...prev, name, email } : { name, email }));
  }, []);

  const addPurchases = useCallback((products: Product[]) => {
    setPurchasedProducts((prev) => [...products, ...prev]);
  }, []);

  return {
    currentUser,
    isAuthOpen,
    setIsAuthOpen,
    purchasedProducts,
    login,
    logout,
    updateProfile,
    addPurchases,
  };
}
