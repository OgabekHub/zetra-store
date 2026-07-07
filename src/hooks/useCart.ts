"use client";

import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/types';
import { Product } from '@/data/products';
import toast from 'react-hot-toast';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // localStorage dan yuklash
  useEffect(() => {
    const savedCart = localStorage.getItem('zetra-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        // xato bo'lsa bo'sh savatcha
      }
    }
    setIsInitialized(true);
  }, []);

  // localStorage ga saqlash
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('zetra-cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

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
