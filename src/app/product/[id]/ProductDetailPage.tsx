"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';
import { getCategoryLabel, categoryToSlug } from '@/utils/categories';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useCart } from '@/hooks/useCart';
import {
  Star, ShoppingCart, ArrowLeft, Download, HardDrive,
  FileType, CheckCircle2, Sparkles, Flame, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductDetailPageProps {
  product: Product;
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {
  const { t, language } = useLanguage();
  const { currency, setCurrency, exchangeRate } = useCurrency();
  const { addToCart, isCartOpen, setIsCartOpen } = useCart();
  const [added, setAdded] = useState(false);

  const getCatLabel = (cat: string) => getCategoryLabel(cat, t);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    toast.success(
      language === 'uz'
        ? 'Savatchaga qo\'shildi!'
        : language === 'ru'
        ? 'Добавлено в корзину!'
        : 'Added to cart!',
      { icon: '🛒' }
    );
    setTimeout(() => setAdded(false), 2000);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-brand-dark text-slate-100">
      {/* Breadcrumb nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            {language === 'uz' ? 'Bosh sahifa' : language === 'ru' ? 'Главная' : 'Home'}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={`/category/${categoryToSlug(product.category)}`}
            className="hover:text-indigo-400 transition-colors"
          >
            {getCatLabel(product.category)}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300 truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
          {/* Left: Image */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-800">
              <Image
                src={product.image}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    {language === 'uz' ? 'Yangi' : language === 'ru' ? 'Новый' : 'New'}
                  </span>
                )}
                {product.reviews >= 150 && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    <Flame className="w-3 h-3" />
                    {language === 'uz' ? 'Trend' : language === 'ru' ? 'Тренд' : 'Hot'}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* File info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <HardDrive className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">
                    {language === 'uz' ? 'Fayl hajmi' : language === 'ru' ? 'Размер файла' : 'File Size'}
                  </p>
                  <p className="text-sm font-semibold text-white">{product.fileSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <FileType className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">
                    {language === 'uz' ? 'Fayl turi' : language === 'ru' ? 'Тип файла' : 'File Type'}
                  </p>
                  <p className="text-sm font-semibold text-white">{product.fileType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                {getCatLabel(product.category)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              {product.title}
            </h1>

            {/* Author + Rating */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {product.author.charAt(0)}
                </div>
                <span className="text-sm text-slate-400">
                  {language === 'uz' ? 'Sotuvchi' : language === 'ru' ? 'Продавец' : 'Seller'}:{' '}
                  <span className="text-slate-200 font-medium">{product.author}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-white">{product.rating}</span>
                <span className="text-xs text-slate-500">({product.reviews} {language === 'uz' ? 'sharh' : language === 'ru' ? 'отзывов' : 'reviews'})</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 leading-relaxed">{product.description}</p>

            {/* Features */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                {language === 'uz' ? 'Xususiyatlar' : language === 'ru' ? 'Характеристики' : 'Features'}
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price + CTA */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-black text-white">
                  {formatPrice(product.price, currency, exchangeRate)}
                </span>
                {product.originalPrice && (
                  <div className="flex flex-col mb-1">
                    <span className="text-sm text-slate-500 line-through">
                      {formatPrice(product.originalPrice, currency, exchangeRate)}
                    </span>
                    <span className="text-xs text-red-400 font-semibold">
                      -{discountPercent}% {language === 'uz' ? 'chegirma' : language === 'ru' ? 'скидка' : 'off'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all duration-300 shadow-xl cursor-pointer ${
                    added
                      ? 'bg-green-600 text-white shadow-green-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                  }`}
                >
                  {added ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {language === 'uz' ? 'Qo\'shildi!' : language === 'ru' ? 'Добавлено!' : 'Added!'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {language === 'uz' ? 'Savatchaga qo\'shish' : language === 'ru' ? 'В корзину' : 'Add to Cart'}
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                {language === 'uz'
                  ? "To'lovdan so'ng darhol yuklash"
                  : language === 'ru'
                  ? 'Мгновенная загрузка после оплаты'
                  : 'Instant download after payment'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
