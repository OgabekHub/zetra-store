/**
 * Pul arifmetikasi bitta joyda.
 *
 * Narxlar USD da, oddiy `number` sifatida saqlanadi. Bugun ko'rinadigan
 * suzuvchi nuqta xatosi yo'q, chunki barcha ko'rsatish nuqtalari yaxlitlaydi.
 * Lekin arifmetika shu modul ortida turgani uchun, kerak bo'lsa butun tiyinga
 * o'tish oltita funksiya tanasini o'zgartirish bilan cheklanadi.
 */

/** Sentgacha yaxlitlaydi. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function addMoney(a: number, b: number): number {
  return roundMoney(a + b);
}

export function mulMoney(value: number, quantity: number): number {
  return roundMoney(value * quantity);
}

/**
 * Sotuvchi kiritgan narxni tahlil qiladi.
 *
 * Avval bu yerda yalang'och `parseFloat` bor edi, ya'ni `"29.999"` qabul
 * qilinardi, `$30.00` deb ko'rsatilardi va `29.999` bo'lib saqlanardi.
 */
export function parseSellerPrice(input: string): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;
  return roundMoney(value);
}
