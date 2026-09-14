import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEED_PRODUCTS } from '@/data/products';
import { slugToCategory, ALL_CATEGORIES, categoryToSlug } from '@/utils/categories';
import { SITE_URL } from '@/utils/site';
import { serializeJsonLd } from '@/utils/jsonLd';
import CategoryPageClient from './CategoryPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_CATEGORIES.map((cat: string) => ({ slug: categoryToSlug(cat) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catName = slugToCategory(slug);
  const canonical = `/category/${slug}`;

  if (!catName) {
    return { title: 'Kategoriya topilmadi', alternates: { canonical }, robots: { index: false } };
  }

  const description = `Zetra'da ${catName} bo'limidagi eng yaxshi raqamli mahsulotlarni ko'ring va xarid qiling.`;
  return {
    title: catName,
    description,
    alternates: { canonical },
    // `openGraph` ni shu yerda berish ildizdagi obyektni butunlay almashtiradi,
    // shuning uchun rasm ham aniq beriladi — avval kategoriya sahifalarida
    // `og:image` umuman yo'q edi.
    openGraph: {
      title: `${catName} — Zetra`,
      description,
      url: canonical,
      type: 'website',
      images: SEED_PRODUCTS.filter((p) => p.category === catName)
        .slice(0, 1)
        .map((p) => ({ url: p.image, width: 1200, height: 630, alt: catName })),
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const catName = slugToCategory(slug);
  if (!catName) notFound();

  const seedProducts = SEED_PRODUCTS.filter((p) => p.category === catName);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: catName,
    url: new URL(`/category/${slug}`, SITE_URL).toString(),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: seedProducts.length,
      itemListElement: seedProducts.map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: p.title,
        url: new URL(`/product/${p.id}`, SITE_URL).toString(),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD, serializeJsonLd orqali <, > va & qochirilgan
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <CategoryPageClient categoryName={catName} seedProducts={seedProducts} />
    </>
  );
}
