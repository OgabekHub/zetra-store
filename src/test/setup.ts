import { afterEach, beforeEach, vi } from 'vitest';

// Store modullari modul darajasida holat saqlaydi (kesh, obunachilar,
// `localStorage` mavjudligi). Har bir test toza boshlanishi uchun ular qayta
// yuklanadi va saqlash tozalanadi.
beforeEach(() => {
  // Kripto testlari `@vitest-environment node` da ishlaydi, u yerda `window` yo'q.
  if (typeof window !== 'undefined') window.localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
