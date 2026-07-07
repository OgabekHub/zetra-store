"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const FALLBACK_RATE = 12800;

export function useCurrency() {
  const [currency, setCurrencyState] = useState<'USD' | 'UZS'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(FALLBACK_RATE);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('API call failed');
        const data = await res.json();
        if (data?.rates?.UZS) {
          setExchangeRate(data.rates.UZS);
        }
      } catch {
        // Fallback rate ishlatiladi — hech narsa qilmaymiz
      }
    };

    fetchRate();
  }, []);

  const setCurrency = (c: 'USD' | 'UZS') => {
    setCurrencyState(c);
    if (c === 'UZS') {
      toast(
        `Valyuta: O'zbek So'mi (1$ = ${exchangeRate.toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm)`,
        { icon: '🇺🇿', duration: 3000 }
      );
    } else {
      toast('Valyuta: AQSH Dollari', { icon: '💵' });
    }
  };

  return { currency, setCurrency, exchangeRate };
}
