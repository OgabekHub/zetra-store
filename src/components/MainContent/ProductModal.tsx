"use client";

import React, { useEffect, useState } from 'react';
import { X, Star, ShoppingCart, CheckCircle2, HardDrive, FileType, Box, Music, Terminal } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';
import { useLanguage } from '@/context/LanguageContext';
import { ThreeDViewer } from './previews/ThreeDViewer';
import { AudioWavePlayer } from './previews/AudioWavePlayer';
import { CodePreviewer } from './previews/CodePreviewer';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  currency: 'USD' | 'UZS';
  exchangeRate: number;
}

const categoryTranslations: Record<string, string> = {
  'Dizayn Shablonlari': 'cat_design',
  '3D Modellar': 'cat_3d',
  'E-Kitoblar': 'cat_ebooks',
  'Dastur Kodelari': 'cat_code',
  'Grafika & Media': 'cat_graphics',
  'O\'yin va Hisoblar': 'cat_games',
  'Litsenziya & Kalitlar': 'cat_keys',
  'Audio & Musiqa': 'cat_audio'
};

const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  currency,
  exchangeRate
}) => {
  const [viewMode, setViewMode] = useState<'image' | 'interactive'>('image');
  const { t } = useLanguage();

  // Reset viewMode when product changes
  useEffect(() => {
    setViewMode('image');
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-w', `${scrollbarW}px`);
      document.body.classList.add('modal-open');
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.classList.remove('modal-open');
        document.documentElement.style.removeProperty('--scrollbar-w');
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const getCategoryDisplayName = (catName: string) => {
    const key = categoryTranslations[catName];
    return key ? t(key) : catName;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-white light:text-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row transform transition-all duration-300 z-10 transition-colors">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-955 rounded-xl bg-slate-950/40 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors z-20 cursor-pointer border border-transparent light:border-slate-200/50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image & Category tag */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center gap-4">
          {['3D Modellar', 'Audio & Musiqa', 'Dastur Kodelari'].includes(product.category) && (
            <div className="flex gap-2 p-1 bg-slate-955/60 light:bg-slate-100 rounded-xl border border-slate-800 light:border-slate-200 self-center">
              <button
                onClick={() => setViewMode('image')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'image'
                    ? 'bg-indigo-650 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                }`}
              >
                {t('prod_cover_image')}
              </button>
              <button
                onClick={() => setViewMode('interactive')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'interactive'
                    ? 'bg-indigo-650 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                }`}
              >
                {product.category === '3D Modellar' ? (
                  <>
                    <Box className="w-3.5 h-3.5" />
                    {t('prod_interactive_3d')}
                  </>
                ) : product.category === 'Audio & Musiqa' ? (
                  <>
                    <Music className="w-3.5 h-3.5" />
                    {t('prod_interactive_audio')}
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5" />
                    {t('prod_interactive_code')}
                  </>
                )}
              </button>
            </div>
          )}

          <div className="relative aspect-video md:aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 light:border-slate-200 flex items-center justify-center bg-slate-950/20">
            {viewMode === 'interactive' ? (
              product.category === '3D Modellar' ? (
                <ThreeDViewer />
              ) : product.category === 'Audio & Musiqa' ? (
                <AudioWavePlayer />
              ) : product.category === 'Dastur Kodelari' ? (
                <CodePreviewer />
              ) : null
            ) : (
              <Image 
                src={product.image} 
                alt={product.title} 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
        </div>

        {/* Column 2: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 light:text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-550/20 light:border-indigo-250">
                {getCategoryDisplayName(product.category)}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white light:text-slate-900 mt-3 leading-tight transition-colors">{product.title}</h2>
              <p className="text-slate-400 light:text-slate-555 text-xs mt-2 transition-colors">
                {t('prod_author')}: <span className="text-slate-202 light:text-slate-850 hover:text-white light:hover:text-indigo-650 cursor-pointer transition-colors font-medium">{product.author}</span>
              </p>
            </div>

            {/* Ratings & reviews */}
            <div className="flex items-center gap-4 bg-slate-800/40 light:bg-slate-50 p-3 rounded-2xl border border-slate-800/80 light:border-slate-200 transition-colors">
              <div className="flex items-center gap-1.5 border-r border-slate-800 light:border-slate-200 pr-4">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-base font-bold text-white light:text-slate-900 transition-colors">{product.rating}</span>
              </div>
              <div className="text-slate-400 light:text-slate-555 text-xs transition-colors">
                <span className="text-slate-205 light:text-slate-900 font-semibold text-white">{product.reviews} </span>{t('prod_reviews_count')}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 light:text-slate-400 uppercase font-semibold transition-colors">{t('prod_desc')}</p>
              <p className="text-slate-300 light:text-slate-700 text-sm leading-relaxed max-h-[120px] overflow-y-auto pr-1 transition-colors">
                {product.description}
              </p>
            </div>

            {/* Technical details */}
            <div className="grid grid-cols-2 gap-4 border-y border-slate-800 light:border-slate-200 py-4 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/50 light:bg-slate-100 rounded-xl flex items-center justify-center border border-slate-700/30 light:border-slate-200/50">
                  <HardDrive className="w-5 h-5 text-indigo-400 light:text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 light:text-slate-400 font-semibold uppercase">{t('prod_file_size')}</p>
                  <p className="text-xs font-bold text-slate-200 light:text-slate-800 transition-colors">{product.fileSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/50 light:bg-slate-100 rounded-xl flex items-center justify-center border border-slate-700/30 light:border-slate-200/50">
                  <FileType className="w-5 h-5 text-purple-400 light:text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 light:text-slate-400 font-semibold uppercase">{t('prod_format')}</p>
                  <p className="text-xs font-bold text-slate-200 light:text-slate-800 truncate max-w-[120px] transition-colors">{product.fileType}</p>
                </div>
              </div>
            </div>

            {/* Features / Xususiyatlar */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 light:text-slate-400 uppercase font-semibold transition-colors">{t('prod_features')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300 light:text-slate-655 text-xs leading-normal transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart */}
          <div className="mt-8 border-t border-slate-800 light:border-slate-200 pt-6 flex items-center justify-between gap-6 transition-colors">
            <div className="flex flex-col">
              <span className="text-xs text-slate-550 light:text-slate-400 line-through">
                {formatPrice(product.price * 1.2, currency, exchangeRate)}
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-white light:text-slate-900 transition-colors">
                {formatPrice(product.price, currency, exchangeRate)}
              </span>
            </div>
            <button 
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex-1 max-w-[220px] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {t('prod_add_to_cart')}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductModal;
