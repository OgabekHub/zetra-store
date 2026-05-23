"use client";

import React, { useEffect } from 'react';
import { X, Star, ShoppingCart, CheckCircle2, HardDrive, FileType } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  currency: 'USD' | 'UZS';
  exchangeRate: number;
}

const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  currency,
  exchangeRate
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row transform transition-all duration-300 z-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/40 hover:bg-slate-800 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image & Category tag */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
          <div className="relative aspect-video md:aspect-square w-full rounded-2xl overflow-hidden border border-slate-800">
            <Image 
              src={product.image} 
              alt={product.title} 
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Column 2: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-550/20">
                {product.category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-3 leading-tight">{product.title}</h2>
              <p className="text-slate-400 text-xs mt-2">
                Muallif: <span className="text-slate-200 hover:text-white cursor-pointer transition-colors font-medium">{product.author}</span>
              </p>
            </div>

            {/* Ratings & reviews */}
            <div className="flex items-center gap-4 bg-slate-800/40 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-base font-bold text-white">{product.rating}</span>
              </div>
              <div className="text-slate-400 text-xs">
                <span className="text-slate-205 font-semibold text-white">{product.reviews} ta</span> baho berilgan
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 uppercase font-semibold">Tavsif:</p>
              <p className="text-slate-300 text-sm leading-relaxed max-h-[120px] overflow-y-auto pr-1">
                {product.description}
              </p>
            </div>

            {/* Technical details */}
            <div className="grid grid-cols-2 gap-4 border-y border-slate-800 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Fayl hajmi</p>
                  <p className="text-xs font-bold text-slate-200">{product.fileSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                  <FileType className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Format</p>
                  <p className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{product.fileType}</p>
                </div>
              </div>
            </div>

            {/* Features / Xususiyatlar */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Asosiy afzalliklari:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300 text-xs leading-normal">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart */}
          <div className="mt-8 border-t border-slate-800 pt-6 flex items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 line-through">
                {formatPrice(product.price * 1.2, currency, exchangeRate)}
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-white">
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
              Savatga qo'shish
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductModal;
