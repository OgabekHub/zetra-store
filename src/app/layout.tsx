import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SITE_URL, SITE_NAME } from "@/utils/site";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zetra — Premium Raqamli Mahsulotlar Bozori",
    template: "%s | Zetra",
  },
  description:
    "Zetra Store — premium dizayn shablonlari, e-kitoblar, dasturlash kodlari, litsenziyalar va boshqalar. O'zbekistoning eng yaxshi raqamli bozori.",
  keywords: ["raqamli mahsulotlar", "figma templates", "e-kitoblar", "dastur kodi", "litsenziya", "zetra", "uzbekistan"],
  authors: [{ name: "Zetra Team" }],
  creator: "Zetra",
  metadataBase: SITE_URL,
  // DIQQAT: bu yerda `alternates` yoki `openGraph.url` bo'lmasligi kerak.
  // Metadata ildizdan bargga sayoz birlashadi, shuning uchun ular barcha 24
  // ta ichki sahifaga meros bo'lib o'tardi va har biri canonical hamda og:url
  // sifatida bosh sahifani e'lon qilardi. Canonical endi har marshrutda
  // alohida beriladi.
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    siteName: SITE_NAME,
    title: "Zetra — Premium Raqamli Mahsulotlar Bozori",
    description: "Zetra Store — dizayn shablonlari, e-kitoblar, dasturlash kodlari va litsenziyalar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zetra — Premium Raqamli Mahsulotlar Bozori",
    description: "O'zbekistoning eng yaxshi raqamli mahsulotlar bozori.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Birinchi bo'yashdan oldin mavzu klassini qo'yadi.
 *
 * Busiz `ThemeContext` 'dark' bilan boshlardi va `.light` klassi faqat
 * hidratatsiyadan keyin qo'shilardi — ya'ni 14 ta fayldagi 521 ta `light:`
 * utilitasi birinchi bo'yashda umuman ishlamasdi va yorug' rejim foydalanuvchisi
 * to'liq qorong'i sahifani ko'rib, keyin keskin almashishga duch kelardi.
 */
const THEME_INIT_SCRIPT = `
(function(){
  try {
    var raw = localStorage.getItem('zetra-theme');
    var theme = 'dark';
    if (raw) {
      var value = raw;
      try {
        var parsed = JSON.parse(raw);
        value = (parsed && typeof parsed === 'object' && 'data' in parsed) ? parsed.data : parsed;
      } catch (e) {}
      if (value === 'light' || value === 'dark') theme = value;
    }
    document.documentElement.classList.add(theme);

    var rawLang = localStorage.getItem('zetra-lang');
    if (rawLang) {
      var lang = rawLang;
      try {
        var parsedLang = JSON.parse(rawLang);
        lang = (parsedLang && typeof parsedLang === 'object' && 'data' in parsedLang) ? parsedLang.data : parsedLang;
      } catch (e) {}
      if (lang === 'uz' || lang === 'ru' || lang === 'en') document.documentElement.lang = lang;
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `data-scroll-behavior="smooth"` Next 16 da majburiy bo'ldi: avval Next
    // navigatsiya paytida `scroll-behavior` ni o'zi bekor qilardi, endi qilmaydi.
    // Busiz sahifalar orasida o'tish yuqoriga sakrash o'rniga silliq sirpanadi.
    <html
      lang="uz"
      data-scroll-behavior="smooth"
      className={`${inter.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line react/no-danger -- statik skript, foydalanuvchi ma'lumotisiz: mavzuni birinchi bo'yashdan oldin qo'yadi */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased bg-brand-dark text-slate-100 light:bg-slate-50 light:text-slate-800 font-sans transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1e293b',
                  color: '#e2e8f0',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                },
                duration: 2500,
              }}
            />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
