import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Zetra - Premium Raqamli Mahsulotlar Bozori",
  description: "Zetra Store - premium dizayn shablonlari, e-kitoblar, dasturlash kodlari, litsenziyalar va boshqalar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased bg-slate-900 text-slate-100 font-sans">
        <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', borderRadius: '12px', border: '1px solid #334155' }, duration: 2500 }} />
        {children}
      </body>
    </html>
  );
}
