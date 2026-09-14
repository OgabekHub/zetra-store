"use client";

import { useCallback, useMemo } from 'react';
import { usePersistentStore } from '@/store/usePersistentStore';
import {
  catalogStore,
  deriveCatalog,
  addProduct as addToCatalog,
  deleteProduct as removeFromCatalog,
} from '@/store/catalogStore';
import type { Product } from '@/types';

export function useProducts() {
  const overlay = usePersistentStore(catalogStore);

  // Katalog fixture ustiga ustqurmani qo'yish orqali hosil qilinadi, shuning
  // uchun `src/data/products.ts` tahrirlari darhol ko'rinadi.
  const allProducts = useMemo(() => deriveCatalog(overlay), [overlay]);

  const addProduct = useCallback((product: Product) => addToCatalog(product), []);
  const deleteProduct = useCallback((id: number) => removeFromCatalog(id), []);

  return { allProducts, addProduct, deleteProduct };
}
