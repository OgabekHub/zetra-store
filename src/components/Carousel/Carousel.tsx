"use client";

import React, { useRef } from 'react';
import Slider from 'react-slick';
import { Book, Code, Image as ImageIcon, Gamepad, Key, Palette, ChevronLeft, ChevronRight, Box, Music, LucideIcon } from 'lucide-react';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useLanguage } from '@/context/LanguageContext';

interface Category {
  id: number;
  name: string;
  translationKey: string;
  icon: LucideIcon;
  count: number;
  color: string;
  bg: string;
}

const categories: Category[] = [
  { id: 1, name: 'Dizayn Shablonlari', translationKey: 'cat_design', icon: Palette, count: 120, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 2, name: '3D Modellar', translationKey: 'cat_3d', icon: Box, count: 75, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { id: 3, name: 'E-Kitoblar', translationKey: 'cat_ebooks', icon: Book, count: 85, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 4, name: 'Dastur Kodelari', translationKey: 'cat_code', icon: Code, count: 340, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 5, name: 'Grafika & Media', translationKey: 'cat_graphics', icon: ImageIcon, count: 210, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 6, name: 'O\'yin va Hisoblar', translationKey: 'cat_games', icon: Gamepad, count: 50, color: 'text-green-400', bg: 'bg-green-400/10' },
  { id: 7, name: 'Litsenziya & Kalitlar', translationKey: 'cat_keys', icon: Key, count: 90, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 8, name: 'Audio & Musiqa', translationKey: 'cat_audio', icon: Music, count: 65, color: 'text-rose-400', bg: 'bg-rose-400/10' },
];

interface CarouselProps {
  onSelectCategory: (category: string | null) => void;
  selectedCategory: string | null;
}

const Carousel: React.FC<CarouselProps> = ({ onSelectCategory, selectedCategory }) => {
  const sliderRef = useRef<Slider>(null);
  const { language, t } = useLanguage();

  const settings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 6,
    slidesToScroll: 1,
    arrows: false, // Hide default slick arrows to prevent layout/overflow bugs
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 5,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2.8,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2.2,
        }
      }
    ]
  };

  return (
    <div className="bg-slate-900 light:bg-slate-50 py-16 border-t border-slate-800/80 light:border-slate-200 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white light:text-slate-900 mb-2 transition-colors">{t('nav_categories')}</h2>
            <p className="text-slate-400 light:text-slate-600 transition-colors">{t('cat_desc')}</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedCategory && (
              <button 
                onClick={() => onSelectCategory(null)}
                className="text-indigo-400 hover:text-indigo-300 light:text-indigo-650 light:hover:text-indigo-750 font-medium transition-colors text-sm cursor-pointer"
              >
                {t('clear_filter')}
              </button>
            )}
            
            {/* Custom Control Navigation Buttons in Header for Desktop/Tablet */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={() => sliderRef.current?.slickPrev()}
                className="w-10 h-10 bg-slate-850 hover:bg-indigo-600 hover:text-white light:bg-white light:hover:bg-indigo-600 light:hover:text-white border border-slate-700/60 light:border-slate-250 text-slate-400 light:text-slate-600 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md light:shadow-slate-200/50"
                aria-label="Oldingi slayd"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => sliderRef.current?.slickNext()}
                className="w-10 h-10 bg-slate-850 hover:bg-indigo-600 hover:text-white light:bg-white light:hover:bg-indigo-600 light:hover:text-white border border-slate-700/60 light:border-slate-250 text-slate-400 light:text-slate-600 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md light:shadow-slate-200/50"
                aria-label="Keyingi slayd"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-2">
          <Slider ref={sliderRef} {...settings} className="category-slider -mx-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <div key={cat.id} className="px-3 outline-none py-1">
                  <div 
                    onClick={() => onSelectCategory && onSelectCategory(cat.name)}
                    className={`bg-slate-800/50 hover:bg-slate-800 light:bg-white light:hover:bg-slate-50 border rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 group ${
                      isSelected 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-600/10 light:shadow-indigo-600/5 bg-slate-800 light:bg-white' 
                        : 'border-slate-700/50 light:border-slate-200 hover:border-slate-600 light:hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${cat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                      isSelected ? 'scale-110 ring-2 ring-indigo-500/30' : ''
                    }`}>
                      <cat.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${cat.color}`} />
                    </div>
                    <h3 className="text-white light:text-slate-800 font-medium text-xs sm:text-sm mb-1 line-clamp-1 transition-colors">{t(cat.translationKey)}</h3>
                    <span className="text-slate-500 light:text-slate-400 text-[10px] sm:text-xs transition-colors">
                      {cat.count} {language === 'uz' ? 'ta mahsulot' : language === 'ru' ? 'товаров' : 'products'}
                    </span>
                  </div>
                </div>
              );
            })}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Carousel;
