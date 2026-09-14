import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useCart } from './useCart';
import { useProducts } from './useProducts';
import { useCurrency } from './useCurrency';
import { useAuth } from './useAuth';
import { cartStore } from '@/store/cartStore';
import { uiStore, useUiState } from '@/store/uiStore';
import { catalogStore } from '@/store/catalogStore';
import { currencyStore, fxRateStore, FALLBACK_RATE } from '@/store/currencyStore';
import { authStore } from '@/store/authStore';
import { accountsStore } from '@/store/accountsStore';
import { purchasesStore, downloadLimitsStore } from '@/store/purchaseStore';
import { languageStore } from '@/store/preferencesStore';
import { LanguageProvider } from '@/context/LanguageContext';
import { SEED_PRODUCTS } from '@/data/products';
import { roundMoney } from '@/utils/money';

// Bu faylda modullar statik import qilinadi (React bitta nusxada qolishi
// uchun), shuning uchun store'lar har testdan oldin qo'lda tozalanadi.
beforeEach(() => {
  cartStore.reset();
  catalogStore.reset();
  currencyStore.reset();
  fxRateStore.reset();
  authStore.reset();
  accountsStore.reset();
  purchasesStore.reset();
  downloadLimitsStore.reset();
  languageStore.reset();
  uiStore.set({ isCartOpen: false, isAuthOpen: false });
});

afterEach(() => {
  cleanup();
});

const product = SEED_PRODUCTS[0];

describe('useCart', () => {
  it('qo\'shish, miqdor, jami va o\'chirish', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addToCart(product));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.isCartOpen).toBe(true);
    expect(result.current.totalItems).toBe(1);

    act(() => result.current.updateQuantity(product.id, 3));
    expect(result.current.totalItems).toBe(3);
    expect(result.current.totalPrice).toBe(roundMoney(product.price * 3));

    act(() => result.current.removeFromCart(product.id));
    expect(result.current.cart).toEqual([]);

    act(() => result.current.addToCart(product));
    act(() => result.current.clearCart());
    expect(result.current.cart).toEqual([]);

    act(() => result.current.setIsCartOpen(false));
    expect(result.current.isCartOpen).toBe(false);
  });

  // Regressiya: avval har bir useCart chaqiruvi o'zining mustaqil nusxasini
  // olardi va bir komponentdagi o'zgarish boshqasida ko'rinmasdi.
  it('ikki komponent bitta savatni ko\'radi', () => {
    const first = renderHook(() => useCart());
    const second = renderHook(() => useCart());
    act(() => first.result.current.addToCart(product));
    expect(second.result.current.cart).toHaveLength(1);
  });
});

describe('useProducts', () => {
  it('mahsulot qo\'shadi va o\'chiradi', () => {
    const { result } = renderHook(() => useProducts());
    const initial = result.current.allProducts.length;

    act(() => result.current.addProduct({ ...product, id: 99_001, title: 'Sotuvchi' }));
    expect(result.current.allProducts).toHaveLength(initial + 1);

    act(() => result.current.deleteProduct(99_001));
    act(() => result.current.deleteProduct(product.id));
    expect(result.current.allProducts).toHaveLength(initial - 1);
  });
});

describe('useCurrency', () => {
  it('kursni yuklaydi va valyutani saqlaydi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ rates: { UZS: 13_000 } }) })),
    );
    const { result } = renderHook(() => useCurrency());
    expect(result.current.exchangeRate).toBe(FALLBACK_RATE);

    await waitFor(() => expect(result.current.exchangeRate).toBe(13_000));

    act(() => result.current.setCurrency('UZS'));
    expect(result.current.currency).toBe('UZS');
    expect(JSON.parse(localStorage.getItem('zetra-currency') ?? 'null')).toEqual({ v: 1, data: 'UZS' });
  });
});

describe('useAuth', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <LanguageProvider>{children}</LanguageProvider>;

  // Regressiya: `zetra-purchases` avval egasiz edi va logout() hammaniki
  // uchun o'chirardi.
  it('xaridlarni faqat joriy foydalanuvchiga ko\'rsatadi va chiqishda o\'chirmaydi', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('Ali', 'ali@mail.uz');
    });
    act(() => {
      result.current.addPurchases([{ ...product, quantity: 2 }]);
    });
    act(() => {
      result.current.addPurchases([{ ...product, quantity: 1 }]);
    });
    expect(result.current.purchases).toHaveLength(2);
    expect(result.current.purchasedProducts).toHaveLength(1);

    act(() => result.current.logout());
    expect(result.current.currentUser).toBeNull();
    expect(result.current.purchases).toEqual([]);

    act(() => {
      result.current.login('Vali', 'vali@mail.uz');
    });
    expect(result.current.purchases).toEqual([]);

    act(() => {
      result.current.login('Ali', 'ali@mail.uz');
    });
    expect(result.current.purchases).toHaveLength(2);
  });

  it('tizimga kirmagan holda xarid yozilmaydi', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let purchase: unknown = 'kutilmagan';
    act(() => {
      purchase = result.current.addPurchases([{ ...product, quantity: 1 }]);
    });
    expect(purchase).toBeNull();
    expect(purchasesStore.getSnapshot()).toEqual([]);
  });

  it('kirish oynasi holati UI store orqali boshqariladi', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setIsAuthOpen(true));
    expect(result.current.isAuthOpen).toBe(true);
    expect(uiStore.getSnapshot().isAuthOpen).toBe(true);
  });

  it('profilni yangilaydi', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.login('Ali', 'ali@mail.uz');
    });
    act(() => {
      result.current.updateProfile('Ali Valiyev', 'ali@mail.uz');
    });
    expect(result.current.currentUser?.name).toBe('Ali Valiyev');
  });
});

describe('useUiState', () => {
  it('faqat haqiqiy o\'zgarishda xabar beradi', () => {
    const listener = vi.fn();
    const unsubscribe = uiStore.subscribe(listener);

    uiStore.set({ isSellerOpen: false });
    expect(listener).not.toHaveBeenCalled();

    uiStore.set({ isSellerOpen: true });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();

    const { result } = renderHook(() => useUiState());
    expect(result.current.isSellerOpen).toBe(true);
    act(() => uiStore.set({ isSellerOpen: false, profileTab: 'security' }));
    expect(result.current.profileTab).toBe('security');
    expect(uiStore.getServerSnapshot().profileTab).toBe('purchases');
  });
});
