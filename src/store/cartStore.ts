/**
 * Savat.
 *
 * Avval `useCart` oddiy `useState` hook'i edi, ya'ni uni chaqirgan har bir
 * komponent o'zining mustaqil nusxasini olardi. Endi yagona manba, va u
 * tab'lar orasida ham sinxronlanadi.
 */
import { createPersistentStore } from './createPersistentStore';
import { STORAGE_KEYS, STORAGE_VERSIONS } from './keys';
import { parseCart } from '@/schemas';
import type { CartItem, Product } from '@/types';

const EMPTY: CartItem[] = [];

export const cartStore = createPersistentStore<CartItem[]>({
  key: STORAGE_KEYS.cart,
  version: STORAGE_VERSIONS[STORAGE_KEYS.cart],
  fallback: () => EMPTY,
  validate: parseCart,
});

export function addItem(product: Product): void {
  cartStore.set((prev) => {
    const existing = prev.find((item) => item.id === product.id);
    if (existing) {
      return prev.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
      );
    }
    return [...prev, { ...product, quantity: 1 }];
  });
}

export function removeItem(id: number): void {
  cartStore.set((prev) => prev.filter((item) => item.id !== id));
}

export function setQuantity(id: number, quantity: number): void {
  if (quantity <= 0) {
    removeItem(id);
    return;
  }
  cartStore.set((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
}

export function clear(): void {
  cartStore.set(EMPTY);
}

export function countItems(cart: CartItem[]): number {
  return cart.reduce((acc, item) => acc + item.quantity, 0);
}

export function subtotal(cart: CartItem[]): number {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return Math.round(total * 100) / 100;
}
