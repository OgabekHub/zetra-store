import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/utils/site';

// `public/robots.txt` o'rniga: bu yerda domen `NEXT_PUBLIC_SITE_URL` dan
// olinadi, ya'ni staging deploy endi production manzilini e'lon qilmaydi.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  };
}
