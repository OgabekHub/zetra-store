import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';
import { SITE_URL, SITE_NAME } from '@/utils/site';
import { serializeJsonLd } from '@/utils/jsonLd';

// Bosh sahifa endi Server Component: shu tufayli u o'z metadata'sini va
// JSON-LD sini eksport qila oladi. Avval `page.tsx` ning o'zi "use client"
// edi, ya'ni canonical faqat ildizda berilishi mumkin edi va u barcha
// ichki sahifalarga meros bo'lib o'tardi.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL.origin,
  logo: `${SITE_URL.origin}/icon.png`,
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL.origin,
  inLanguage: ['uz', 'ru', 'en'],
};

export default function Page() {
  return (
    <>
      {/* JSON-LD `next/script` emas, oddiy <script> bilan beriladi, va `<`
          belgisi \u003c ga qochiriladi — Next hujjatlari shuni talab qiladi. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD, serializeJsonLd orqali <, > va & qochirilgan
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([organizationLd, websiteLd]),
        }}
      />
      <HomeClient />
    </>
  );
}
