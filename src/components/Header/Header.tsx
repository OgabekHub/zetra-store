"use client";

import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface HeaderProps {
  onExploreClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExploreClick }) => {
  const handleExplore = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      const element = document.getElementById('products-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-900 pt-16 pb-32">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-indigo-400 text-sm font-medium mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span>Yangi raqamli mahsulotlar bozori</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
          Eng yaxshi raqamli <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            mahsulotlar bitta joyda
          </span>
        </h1>
        
        <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Zetra Store - bu premium dizayn shablonlari, foydali e-kitoblar, tayyor dasturlash kodlari va litsenziyalarni sotib olish va sotish uchun eng zo'r platforma.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleExplore}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl shadow-indigo-600/30 flex items-center gap-2 group cursor-pointer"
          >
            Katalogga o'tish
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => toast('Ro\'yxatdan o\'tish sahifasi tez orada ishga tushadi!', { icon: '🚀' })}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-2xl font-semibold text-lg transition-all duration-300 cursor-pointer"
          >
            Sotuvchi bo'lish
          </button>
        </div>

        {/* Stats / Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-slate-800 pt-10">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold text-lg">Darhol Yuklab Olish</h3>
            <p className="text-slate-400 text-sm mt-1">To'lovdan so'ng darhol faylga ega bo'ling</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg">Xavfsiz To'lovlar</h3>
            <p className="text-slate-400 text-sm mt-1">Barcha tranzaksiyalar 100% himoyalangan</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-white font-semibold text-lg">Premium Sifat</h3>
            <p className="text-slate-400 text-sm mt-1">Faqat tekshirilgan va sifatli mahsulotlar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
