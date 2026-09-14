import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/utils/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Premium Raqamli Mahsulotlar Bozori`,
    short_name: SITE_NAME,
    description: "O'zbekistoning eng yaxshi raqamli mahsulotlar bozori.",
    start_url: '/',
    display: 'standalone',
    background_color: '#090E17',
    theme_color: '#090E17',
    lang: 'uz',
    icons: [{ src: '/icon.png', sizes: 'any', type: 'image/png' }],
  };
}
