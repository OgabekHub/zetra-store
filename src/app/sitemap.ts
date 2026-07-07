import { MetadataRoute } from 'next';
import { products } from '@/data/products';
import { ALL_CATEGORIES, categoryToSlug } from '@/utils/categories';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zetra.uz';

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/product/${p.id}`,
    lastModified: new Date(p.createdAt || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = ALL_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/category/${categoryToSlug(cat)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...categoryPages,
    ...productPages,
  ];
}
