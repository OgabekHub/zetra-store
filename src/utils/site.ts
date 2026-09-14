/**
 * Sayt manzili bitta joyda.
 *
 * Avval domen to'rt joyda qattiq yozilgan edi: `sitemap.ts`, `layout.tsx`
 * dagi `metadataBase`, `layout.tsx` dagi `openGraph.url` va
 * `public/robots.txt`. Staging deploy production URL'larini e'lon qilardi.
 */
const DEFAULT_SITE_URL = 'https://zetra.uz';

/**
 * `NEXT_PUBLIC_SITE_URL` ni tekshirib o'qiydi.
 *
 * O'zgaruvchi berilgan, lekin bo'sh yoki yaroqsiz bo'lsa (masalan, CI da
 * sozlanmagan secret) standart manzil ishlatiladi. Avval `new URL('')` modul
 * yuklanayotganda istisno tashlab, butun build'ni yiqitardi.
 */
export function resolveSiteUrl(raw: string | undefined): URL {
  const candidate = raw?.trim();
  if (candidate) {
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url;
    } catch {
      // Yaroqsiz manzil — standartga qaytiladi.
    }
  }
  return new URL(DEFAULT_SITE_URL);
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_NAME = 'Zetra';
