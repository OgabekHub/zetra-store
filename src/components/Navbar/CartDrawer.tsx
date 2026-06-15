"use client";

import React, { useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { CartItem } from '@/types';
import { formatPrice } from '@/utils/price';
import { useLanguage } from '@/context/LanguageContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  currency: 'USD' | 'UZS';
  exchangeRate: number;
  onCheckout: () => void;
  onStartShopping?: () => void;
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

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  currency,
  exchangeRate,
  onCheckout,
  onStartShopping
}) => {
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      // Measure scrollbar width and store as CSS var to compensate layout shift
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

  const getCategoryDisplayName = (catName: string) => {
    const key = categoryTranslations[catName];
    return key ? t(key) : catName;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`} 
      role="dialog" 
      aria-modal="true" 
      aria-label="Savatcha"
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md flex">
        {/* Drawer Panel */}
        <div 
          className={`w-full bg-slate-950/95 light:bg-white border-l border-slate-800 light:border-slate-200 text-white light:text-slate-800 shadow-2xl flex flex-col h-full transition-transform duration-300 ease-in-out backdrop-blur-md ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800 light:border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white light:text-slate-900 transition-colors">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              {t('cart_title')}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-800 rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800/50 light:bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-700/50 light:border-slate-200 text-slate-500 light:text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white light:text-slate-900 transition-colors">{t('cart_empty')}</h3>
                  <p className="text-slate-550 light:text-slate-600 text-sm mt-1 transition-colors">{t('cart_empty_sub')}</p>
                </div>
                <button 
                  onClick={onStartShopping ?? onClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('cart_start_shopping')}
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-800/80 light:border-slate-200 hover:border-slate-700/50 light:hover:border-slate-300/80 transition-all">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1 leading-snug text-white light:text-slate-900 transition-colors">{item.title}</h4>
                      <p className="text-slate-550 light:text-slate-500 text-[10px] mt-0.5 transition-colors">{getCategoryDisplayName(item.category)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-slate-700 light:border-slate-250 rounded-lg p-1 bg-slate-900/50 light:bg-white">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-800 light:hover:bg-slate-100 rounded text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-semibold w-5 text-center text-white light:text-slate-800 transition-colors">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-800 light:hover:bg-slate-100 rounded text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <span className="text-sm font-bold text-indigo-400 light:text-indigo-650 transition-colors">
                        {formatPrice(item.price * item.quantity, currency, exchangeRate)}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 self-start text-slate-500 light:text-slate-455 hover:text-red-400 light:hover:text-red-650 rounded-lg hover:bg-red-500/10 light:hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkouts */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-slate-800 light:border-slate-200 bg-slate-950/50 light:bg-slate-50 backdrop-blur-md space-y-4 transition-colors">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 light:text-slate-600 transition-colors">{t('cart_subtotal')}:</span>
                <span className="text-xl font-bold text-white light:text-slate-900 transition-colors">
                  {formatPrice(subtotal, currency, exchangeRate)}
                </span>
              </div>
              <button 
                onClick={onCheckout}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
              >
                {t('cart_checkout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
