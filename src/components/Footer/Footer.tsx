"use client";

import React from 'react';
import Image from 'next/image';
import { Mail, Send, MessageCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import zetraLogo from '@/assets/images/zetra-logo2-backup.png';

const Footer: React.FC = () => {
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Xabarnomaga muvaffaqiyatli obuna bo\'ldingiz!');
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-8 relative overflow-hidden">
      {/* Background neon blur */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-indigo-500 blur-[80px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center cursor-pointer">
              <Image src={zetraLogo} alt="Zetra Logo" className="h-48 w-48 object-contain -my-18 brightness-100" priority={false} />
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Zetra Store — premium dizayn shablonlari, e-kitoblar, dasturlash kodlari va litsenziya kalitlarini sotib olish hamda sotish uchun O'zbekistondagi eng ilg'or raqamli mahsulotlar bozori.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Telegram" className="w-10 h-10 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="w-10 h-10 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" aria-label="Github" className="w-10 h-10 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a href="#" aria-label="Youtube" className="w-10 h-10 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Katalog</h3>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Dizayn shablonlari sahifasi tez orada!', { icon: '📦' }); }} className="hover:text-white transition-colors">Dizayn shablonlari</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('E-kitoblar sahifasi tez orada!', { icon: '📦' }); }} className="hover:text-white transition-colors">E-kitoblar</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Dastur kodlari sahifasi tez orada!', { icon: '📦' }); }} className="hover:text-white transition-colors">Dastur kodlari</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Litsenziyalar sahifasi tez orada!', { icon: '📦' }); }} className="hover:text-white transition-colors">Litsenziyalar</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Ma'lumot</h3>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Platforma haqida sahifasi tez orada!', { icon: 'ℹ️' }); }} className="hover:text-white transition-colors">Platforma haqida</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Foydalanish shartlari sahifasi tez orada!', { icon: 'ℹ️' }); }} className="hover:text-white transition-colors">Foydalanish shartlari</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Maxfiylik siyosati sahifasi tez orada!', { icon: 'ℹ️' }); }} className="hover:text-white transition-colors">Maxfiylik siyosati</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Yordam sahifasi tez orada!', { icon: 'ℹ️' }); }} className="hover:text-white transition-colors">Yordam / FAQ</a></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Xabarnoma</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Yangi mahsulotlar va chegirmalardan birinchilardan bo'lib xabardor bo'ling. Obuna bo'ling!
            </p>
            <form onSubmit={handleNewsletterSubmit} className="relative mt-2">
              <input
                type="email"
                required
                className="w-full pl-3 pr-12 py-3 border border-slate-800 rounded-xl bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Elektron pochtangiz..."
              />
              <button
                type="submit"
                className="absolute inset-y-1.5 right-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="border-t border-slate-900 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Zetra.uz. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Qo'llab-quvvatlash
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">To'lov usullari</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Kafolatlar</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
