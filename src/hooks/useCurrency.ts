"use client";

import { useCallback, useEffect } from 'react';
import { usePersistentStore } from '@/store/usePersistentStore';
import {
  currencyStore,
  fxRateStore,
  setCurrency as setCurrencyValue,
  ensureExchangeRate,
} from '@/store/currencyStore';
import type { Currency } from '@/types';

export function useCurrency() {
  const currency = usePersistentStore(currencyStore);
  const { rate: exchangeRate } = usePersistentStore(fxRateStore);

  // Kurs TTL ichida bo'lsa hech qanday so'rov ketmaydi.
  useEffect(() => {
    void ensureExchangeRate();
  }, []);

  // Tost bu yerdan olib tashlandi: setter ichida `toast()` chaqirilgani uchun
  // Navbar ham o'z tostini chiqarardi va har bosishda ikkita ustma-ust
  // bildirishnoma paydo bo'lardi. Endi bildirishnomani chaqiruvchi beradi.
  const setCurrency = useCallback((next: Currency) => setCurrencyValue(next), []);

  return { currency, setCurrency, exchangeRate };
}
