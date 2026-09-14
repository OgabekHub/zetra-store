import type { NextConfig } from "next";

/**
 * Xavfsizlik sarlavhalari.
 *
 * CSP nonce'siz, `next.config` orqali beriladi — Next 16 hujjatidagi
 * "Without Nonces" usuli (`01-app/02-guides/content-security-policy.md`).
 * Nonce har so'rovda yangi bo'lishi kerak va barcha sahifalarni dinamik
 * render'ga majburlaydi; bu loyihadagi statik generatsiyani (15 mahsulot va
 * 8 kategoriya sahifasi) yo'q qilardi. Shuning uchun `script-src` da
 * `'unsafe-inline'` qoladi (Next o'z inline skriptlarini shunday uzatadi),
 * qolgan hamma direktiva esa qat'iy.
 */
export function buildSecurityHeaders(isDev: boolean): { key: string; value: string }[] {
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self'",
    // Valyuta kursi API si. Dev rejimida HMR websocket ham kerak.
    `connect-src 'self' https://open.er-api.com${isDev ? ' ws: wss:' : ''}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // `frame-ancestors` ni qo'llamaydigan eski brauzerlar uchun.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    // HSTS faqat production'da: localhost ni HTTPS ga majburlab qo'ymaslik uchun.
    ...(isDev
      ? []
      : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
  ];
}

const nextConfig: NextConfig = {
  // `X-Powered-By: Next.js` sarlavhasi foydalanilgan texnologiyani oshkor qiladi.
  poweredByHeader: false,
  images: {
    // `pathname` ataylab aniq berilgan. `search` esa berilmaydi: Unsplash
    // manzillari `?q=80&w=2070&auto=format&fit=crop` so'rovi bilan keladi,
    // va `search: ''` ularning hammasini rad etardi.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-*',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders(process.env.NODE_ENV === 'development'),
      },
    ];
  },
  async redirects() {
    // Eski slug apostrof bilan hosil qilinardi. Ikkala shakl ham qamraladi:
    // sitemap'da xom apostrof, `next/link` navigatsiyasida esa `%27`.
    const legacyGameSlugs = ["/category/o'yin-va-hisoblar", '/category/o%27yin-va-hisoblar'];
    return legacyGameSlugs.map((source) => ({
      source,
      destination: '/category/oyin-va-hisoblar',
      permanent: true,
    }));
  },
};

export default nextConfig;
