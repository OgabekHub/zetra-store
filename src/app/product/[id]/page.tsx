import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEED_PRODUCTS } from '@/data/products';
import { categoryToSlug } from '@/utils/categories';
import { SITE_URL } from '@/utils/site';
import { serializeJsonLd } from '@/utils/jsonLd';
import ProductDetailPage from './ProductDetailPage';

interface Props {
  params: Promise<{ id: string }>;
}

/** Fixture mahsulotlari build vaqtida oldindan render qilinadi. */
export function generateStaticParams() {
  return SEED_PRODUCTS.map((p) => ({ id: String(p.id) }));
}

function parseProductId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const productId = parseProductId(id);
  const product = productId === null ? undefined : SEED_PRODUCTS.find((p) => p.id === productId);

  // Canonical har sahifada alohida beriladi. Avval u faqat ildizda `"/"` deb
  // qo'yilgan edi va metadata sayoz birlashgani uchun barcha mahsulot va
  // kategoriya sahifalari o'zini bosh sahifa deb e'lon qilardi.
  const canonical = `/product/${id}`;

  if (!product) {
    return { title: 'Mahsulot topilmadi', alternates: { canonical }, robots: { index: false } };
  }

  const description = product.description.slice(0, 160);
  return {
    title: product.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.title,
      description,
      url: canonical,
      images: [{ url: product.image, width: 1200, height: 630, alt: product.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      images: [product.image],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const productId = parseProductId(id);
  if (productId === null) notFound();

  // DIQQAT: bu yerda `notFound()` chaqirilmaydi. Sotuvchi qo'shgan
  // mahsulotlar faqat brauzerdagi `localStorage` da yashaydi, ya'ni server
  // ularni ko'ra olmaydi. Avval shu `notFound()` sotuvchining o'z mahsuloti
  // sahifasini 404 qilardi. Endi klient katalogdan qidiradi.
  const seedProduct = SEED_PRODUCTS.find((p) => p.id === productId) ?? null;

  const jsonLd = seedProduct
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: seedProduct.title,
          description: seedProduct.description,
          image: seedProduct.image,
          category: seedProduct.category,
          brand: { '@type': 'Brand', name: seedProduct.author },
          offers: {
            '@type': 'Offer',
            price: seedProduct.price.toFixed(2),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: new URL(`/product/${seedProduct.id}`, SITE_URL).toString(),
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Zetra',
              item: SITE_URL.origin,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: seedProduct.category,
              item: new URL(
                `/category/${categoryToSlug(seedProduct.category)}`,
                SITE_URL,
              ).toString(),
            },
            { '@type': 'ListItem', position: 3, name: seedProduct.title },
          ],
        },
      ]
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- JSON-LD, serializeJsonLd orqali <, > va & qochirilgan
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      <ProductDetailPage productId={productId} seedProduct={seedProduct} />
    </>
  );
}
