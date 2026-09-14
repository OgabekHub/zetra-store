"use client";

/**
 * Saqlanmaydigan UI holati: qaysi modal ochiq, qidiruv matni, tanlangan
 * kategoriya.
 *
 * Bu ma'lumot brauzer yopilgach yo'qolishi kerak va tab'lar orasida
 * ergashmasligi kerak, shuning uchun u `localStorage` ga yozilmaydi. Lekin
 * u ham yagona manba bo'lishi kerak, chunki Navbar ham, MainContent ham,
 * mahsulot sahifasi ham unga qaraydi.
 */
import { useSyncExternalStore } from 'react';

export interface UiState {
  isCartOpen: boolean;
  isAuthOpen: boolean;
  isSellerOpen: boolean;
  isProfileOpen: boolean;
  isPaymentOpen: boolean;
  profileTab: 'purchases' | 'settings' | 'security';
}

const INITIAL: UiState = {
  isCartOpen: false,
  isAuthOpen: false,
  isSellerOpen: false,
  isProfileOpen: false,
  isPaymentOpen: false,
  profileTab: 'purchases',
};

let state: UiState = INITIAL;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export const uiStore = {
  getSnapshot: (): UiState => state,
  getServerSnapshot: (): UiState => INITIAL,
  subscribe(onChange: () => void): () => void {
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  },
  set(patch: Partial<UiState>): void {
    const next = { ...state, ...patch };
    const changed = (Object.keys(patch) as (keyof UiState)[]).some(
      (key) => !Object.is(state[key], next[key]),
    );
    if (!changed) return;
    state = next;
    emit();
  },
};

export function useUiState(): UiState {
  return useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot, uiStore.getServerSnapshot);
}
