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
