import { ImageResponse } from 'next/og';

/**
 * Ijtimoiy tarmoq rasmi.
 *
 * Avval `layout.tsx` `/og-image.png` ga ishora qilardi, lekin `public/` da
 * bunday fayl yo'q edi — har bir Telegram/Facebook/Twitter ulashuvi 404
 * olardi. Fayl konvensiyasi ishlatilgani uchun `twitter-image` ham shundan
 * hosil bo'ladi.
 */
export const alt = 'Zetra — Premium Raqamli Mahsulotlar Bozori';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #090E17 0%, #0e1624 60%, #00302680 100%)',
          color: '#e2e8f0',
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: -3,
            color: '#00F2C2',
            display: 'flex',
          }}
        >
          Zetra
        </div>
        <div
          style={{
            fontSize: 40,
            marginTop: 18,
            textAlign: 'center',
            lineHeight: 1.35,
            display: 'flex',
          }}
        >
          Premium raqamli mahsulotlar bozori
        </div>
        <div
          style={{
            fontSize: 26,
            marginTop: 36,
            color: '#94a3b8',
            display: 'flex',
          }}
        >
          Dizayn shablonlari · E-kitoblar · Dastur kodlari · Litsenziyalar
        </div>
      </div>
    ),
    size,
  );
}
