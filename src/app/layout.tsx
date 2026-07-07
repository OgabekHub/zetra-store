import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Zetra — Premium Raqamli Mahsulotlar Bozori",
    template: "%s | Zetra",
  },
  description: "Zetra Store — premium dizayn shablonlari, e-kitoblar, dasturlash kodlari, litsenziyalar va boshqalar. O'zbekistoning eng yaxshi raqamli bozori.",
  keywords: ["raqamli mahsulotlar", "figma templates", "e-kitoblar", "dastur kodi", "litsenziya", "zetra", "uzbekistan"],
  authors: [{ name: "Zetra Team" }],
  creator: "Zetra",
  metadataBase: new URL("https://zetra.uz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "https://zetra.uz",
    siteName: "Zetra",
    title: "Zetra — Premium Raqamli Mahsulotlar Bozori",
    description: "Zetra Store — dizayn shablonlari, e-kitoblar, dasturlash kodlari va litsenziyalar.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zetra — Premium Digital Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zetra — Premium Raqamli Mahsulotlar Bozori",
    description: "O'zbekistoning eng yaxshi raqamli mahsulotlar bozori.",
    images: ["/og-image.png"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased bg-brand-dark text-slate-100 light:bg-slate-50 light:text-slate-800 font-sans transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', borderRadius: '12px', border: '1px solid #334155' }, duration: 2500 }} />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
