/**
 * Tashqi rasm manzillarini tekshirish.
 *
 * `next.config.ts` faqat bitta manbaga ruxsat beradi. Sotuvchi boshqa manzil
 * kiritsa, `next/image` render paytida istisno tashlaydi va mahsulot jadvali
 * **localStorage qo'lda tozalanmaguncha** oq ekranga aylanadi. Shuning uchun
 * manzil saqlashdan oldin tekshiriladi.
 *
 * Bu ro'yxat `next.config.ts` dagi `remotePatterns` bilan aynan mos bo'lishi
 * shart — `src/utils/utils.test.ts` buni tekshiradi.
 */
interface AllowedImageSource {
  hostname: string;
  /** `next.config.ts` dagi `pathname: '/photo-*'` ga mos. */
  pathname: RegExp;
}

const ALLOWED_IMAGE_SOURCES: readonly AllowedImageSource[] = [
  { hostname: 'images.unsplash.com', pathname: /^\/photo-[^/]+$/ },
];

export function isAllowedImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;
  // `https://user:pass@host` va nostandart portlar `next.config.ts` da
  // ko'rsatilmagan, ya'ni ular ham `next/image` ni yiqitadi.
  if (url.username !== '' || url.password !== '') return false;
  if (url.port !== '') return false;

  return ALLOWED_IMAGE_SOURCES.some(
    (source) => source.hostname === url.hostname && source.pathname.test(url.pathname),
  );
}

export function allowedImageHostsLabel(): string {
  return ALLOWED_IMAGE_SOURCES.map((source) => source.hostname).join(', ');
}
