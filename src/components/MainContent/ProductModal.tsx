"use client";

import React from 'react';
import { X, Star, ShoppingCart, CheckCircle2, HardDrive, FileType } from 'lucide-react';
import { Product } from '../../data/products';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row transform transition-all duration-300 relative z-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/40 hover:bg-slate-850 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image & Category tag */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
          <div className="relative aspect-video md:aspect-square w-full rounded-2xl overflow-hidden border border-slate-800">
            <img 
              src={product.image} 
              alt={product.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs font-semibold text-white">
              {product.category}
            </div>
          </div>
        </div>

        {/* Column 2: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 md:pl-0 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2 pr-8">{product.title}</h2>
              <p className="text-slate-400 text-sm">
                Sotuvchi: <span className="text-slate-350 font-medium hover:text-white cursor-pointer">{product.author}</span>
              </p>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold">{product.rating}</span>
              </div>
              <span className="text-xs text-slate-500">({product.reviews} ta fikrlar)</span>
            </div>

            {/* Description */}
            <p className="text-slate-350 text-sm leading-relaxed">
              {product.description}
            </p>

            {/* Files info */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-850 rounded-xl flex items-center justify-center text-indigo-400">
                  <HardDrive className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Fayl Hajmi</p>
                  <p className="text-xs font-bold text-white">{product.fileSize || 'Noma\'lum'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-850 rounded-xl flex items-center justify-center text-indigo-400">
                  <FileType className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Fayl Turi</p>
                  <p className="text-xs font-bold text-white">{product.fileType || 'Noma\'lum'}</p>
                </div>
              </div>
            </div>

            {/* Features / Xususiyatlar */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Asosiy afzalliklari:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-350 text-xs leading-normal">
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
              <span className="text-xs text-slate-500 line-through">${(product.price * 1.2).toFixed(2)}</span>
              <span className="text-2xl md:text-3xl font-extrabold text-white">${product.price.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex-1 max-w-[220px] py-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-indigo-650/20 active:scale-[0.98]"
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
