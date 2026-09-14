import type { MetadataRoute } from 'next';
import { SEED_PRODUCTS } from '@/data/products';
import { ALL_CATEGORIES, categoryToSlug } from '@/utils/categories';
import { SITE_URL } from '@/utils/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.origin;

  // `lastModified` faqat haqiqiy sana mavjud bo'lganda beriladi.
  // Avval bosh sahifa va kategoriyalar uchun yalang'och `new Date()` yozilgan
  // edi; sitemap standart holda keshlanadi, shuning uchun u build vaqtida
  // muzlab qolib, abadiy yolg'on `lastmod` e'lon qilardi.
  const productPages: MetadataRoute.Sitemap = SEED_PRODUCTS.map((p) => ({
    url: `${base}/product/${p.id}`,
    ...(p.createdAt ? { lastModified: new Date(p.createdAt) } : {}),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = ALL_CATEGORIES.map((cat) => ({
    url: `${base}/category/${categoryToSlug(cat)}`,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [
    { url: base, changeFrequency: 'daily', priority: 1.0 },
    ...categoryPages,
    ...productPages,
  ];
}
