"use client";

import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Download } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface HeaderProps {
  onExploreClick?: () => void;
  onBecomeSeller?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExploreClick, onBecomeSeller }) => {
  const { language, t } = useLanguage();
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
    <div className="relative overflow-hidden bg-slate-900 light:bg-slate-100 pt-16 pb-32 transition-colors duration-300">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 light:opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 light:bg-slate-200/50 border border-slate-700 light:border-slate-300 text-indigo-400 light:text-indigo-650 text-sm font-medium mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span>{language === 'uz' ? 'Yangi raqamli mahsulotlar bozori' : language === 'ru' ? 'Новый рынок цифровых продуктов' : 'New digital product marketplace'}</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white light:text-slate-900 tracking-tight mb-8 max-w-4xl mx-auto leading-tight transition-colors">
          {language === 'uz' ? (
            <>
              Eng yaxshi raqamli <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">mahsulotlar bitta joyda</span>
            </>
          ) : language === 'ru' ? (
            <>
              Лучшие цифровые <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">продукты в одном месте</span>
            </>
          ) : (
            <>
              The best digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">products in one place</span>
            </>
          )}
        </h1>
        
        <p className="mt-4 text-base md:text-lg text-slate-400 light:text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed transition-colors">
          {t('hero_subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleExplore}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-base transition-all duration-300 shadow-xl shadow-indigo-600/30 flex items-center gap-2 group cursor-pointer w-full sm:w-auto justify-center"
          >
            {t('hero_start_btn')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={onBecomeSeller}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 light:bg-white light:hover:bg-slate-100 text-white light:text-slate-800 border border-slate-700 light:border-slate-300 rounded-2xl font-semibold text-base transition-all duration-300 cursor-pointer shadow-md light:shadow-slate-200/50 w-full sm:w-auto"
          >
            {t('hero_seller_btn')}
          </button>
        </div>

        {/* Stats / Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-slate-800 light:border-slate-250 pt-10">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-indigo-500/10 light:bg-indigo-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
              <Download className="w-6 h-6 text-indigo-400 light:text-indigo-600" />
            </div>
            <h3 className="text-white light:text-slate-900 font-semibold text-base transition-colors">{language === 'uz' ? 'Darhol Yuklab Olish' : language === 'ru' ? 'Мгновенное скачивание' : 'Instant Download'}</h3>
            <p className="text-slate-400 light:text-slate-550 text-xs mt-1 transition-colors">{language === 'uz' ? 'To\'lovdan so\'ng darhol faylga ega bo\'ling' : language === 'ru' ? 'Получите ваши файлы сразу после оплаты' : 'Get your files immediately after checkout'}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-purple-500/10 light:bg-purple-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
              <ShieldCheck className="w-6 h-6 text-purple-400 light:text-purple-600" />
            </div>
            <h3 className="text-white light:text-slate-900 font-semibold text-base transition-colors">{language === 'uz' ? 'Xavfsiz To\'lovlar' : language === 'ru' ? 'Безопасные платежи' : 'Secure Payments'}</h3>
            <p className="text-slate-400 light:text-slate-550 text-xs mt-1 transition-colors">{language === 'uz' ? 'Barcha tranzaksiyalar 100% himoyalangan' : language === 'ru' ? 'Все транзакции защищены на 100%' : 'All transactions are 100% encrypted'}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-pink-500/10 light:bg-pink-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
              <Sparkles className="w-6 h-6 text-pink-400 light:text-pink-600" />
            </div>
            <h3 className="text-white light:text-slate-900 font-semibold text-base transition-colors">{language === 'uz' ? 'Premium Sifat' : language === 'ru' ? 'Премиум качество' : 'Premium Quality'}</h3>
            <p className="text-slate-400 light:text-slate-550 text-xs mt-1 transition-colors">{language === 'uz' ? 'Faqat tekshirilgan va sifatli mahsulotlar' : language === 'ru' ? 'Только проверенные и качественные товары' : 'Only curated and verified products'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
