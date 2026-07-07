"use client";

import { useState, useEffect, useCallback } from 'react';
import { Product, products as defaultProducts } from '@/data/products';

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedProducts = localStorage.getItem('zetra-products');
    if (savedProducts) {
      try {
        setAllProducts(JSON.parse(savedProducts));
      } catch {
        setAllProducts(defaultProducts);
      }
    } else {
      setAllProducts(defaultProducts);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('zetra-products', JSON.stringify(allProducts));
    }
  }, [allProducts, isInitialized]);

  const addProduct = useCallback((product: Product) => {
    setAllProducts((prev) => [product, ...prev]);
  }, []);

  const deleteProduct = useCallback((id: number) => {
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    allProducts,
    addProduct,
    deleteProduct,
  };
}
