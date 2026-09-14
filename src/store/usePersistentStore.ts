"use client";

import { useSyncExternalStore } from 'react';
import type { PersistentStore } from './createPersistentStore';

/**
 * Store'ni React'ga ulaydi.
 *
 * `getServerSnapshot` majburiy: SSR paytida va hidratatsiyaning birinchi
 * renderida u ishlatiladi, keyin darhol klient snapshot'i bilan qayta render
 * bo'ladi. Aynan shu narsa "server qiymati != klient qiymati, va bu normal"
 * holatini ifodalaydi — `useState` ning lazy initializer'i buni qila olmaydi.
 */
export function usePersistentStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
