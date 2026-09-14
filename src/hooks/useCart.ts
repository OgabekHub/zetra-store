"use client";

import { useCallback, useMemo } from 'react';
import { usePersistentStore } from '@/store/usePersistentStore';
import {
  cartStore,
  addItem,
  removeItem,
  setQuantity,
  clear,
  countItems,
  subtotal,
} from '@/store/cartStore';
import { uiStore, useUiState } from '@/store/uiStore';
import type { Product } from '@/types';

export function useCart() {
  const cart = usePersistentStore(cartStore);
  const { isCartOpen } = useUiState();

  const setIsCartOpen = useCallback((open: boolean) => {
    uiStore.set({ isCartOpen: open });
  }, []);

  const addToCart = useCallback((product: Product) => {
    addItem(product);
    uiStore.set({ isCartOpen: true });
  }, []);

  const removeFromCart = useCallback((id: number) => removeItem(id), []);
  const updateQuantity = useCallback((id: number, quantity: number) => setQuantity(id, quantity), []);
  const clearCart = useCallback(() => clear(), []);

  const totalItems = useMemo(() => countItems(cart), [cart]);
  const totalPrice = useMemo(() => subtotal(cart), [cart]);

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
