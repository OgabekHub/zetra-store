import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import { slugToCategory, getCategoryLabel, ALL_CATEGORIES, categoryToSlug } from '@/utils/categories';
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
  if (!catName) return { title: 'Kategoriya — Zetra' };

  return {
    title: `${catName} — Zetra`,
    description: `Zetra'da ${catName} bo'limidagi eng yaxshi raqamli mahsulotlarni ko'ring va xarid qiling.`,
    openGraph: {
      title: `${catName} — Zetra`,
      description: `Zetra'da ${catName} bo'limidagi eng yaxshi raqamli mahsulotlar.`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const catName = slugToCategory(slug);
  if (!catName) notFound();

  const categoryProducts = products.filter((p) => p.category === catName);

  return <CategoryPageClient categoryName={catName} products={categoryProducts} />;
}
