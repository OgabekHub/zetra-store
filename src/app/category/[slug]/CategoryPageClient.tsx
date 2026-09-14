"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { formatPrice } from '@/utils/price';
import { getCategoryLabel } from '@/utils/categories';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { Star, ShoppingCart, Eye, ArrowLeft, Sparkles, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryPageClientProps {
  categoryName: string;
  /** Serverda render qilingan fixture ro'yxati. */
  seedProducts: Product[];
}

export default function CategoryPageClient({ categoryName, seedProducts }: CategoryPageClientProps) {
  const { t } = useLanguage();
  const { currency, exchangeRate } = useCurrency();
  const { addToCart } = useCart();
  const { allProducts } = useProducts();
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc'>('newest');

  const getCatLabel = (cat: string) => getCategoryLabel(cat, t);

  // Katalogdan olinadi (sotuvchi mahsulotlari va o'chirishlar shu yerda
  // ko'rinadi); u hali bo'sh bo'lsa serverdan kelgan ro'yxat ishlatiladi.
  const products = useMemo(() => {
    const fromCatalog = allProducts.filter((p) => p.category === categoryName);
    return fromCatalog.length > 0 || allProducts.length > 0 ? fromCatalog : seedProducts;
  }, [allProducts, categoryName, seedProducts]);

  const sorted = useMemo(() => {
    // `new Date('')` -> `Invalid Date`, `.getTime()` -> `NaN`. `NaN` qaytaradigan
    // taqqoslash `Array.sort` uchun aniqlanmagan xatti-harakat. Sotuvchi
    // qo'shgan mahsulotlarda `createdAt` bo'lmasligi mumkin.
    const time = (value?: string) => {
      const parsed = Date.parse(value ?? '');
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return [...products].sort((a, b) => {
      if (sortBy === 'popular') return b.reviews - a.reviews;
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return time(b.createdAt) - time(a.createdAt) || b.id - a.id;
    });
  }, [products, sortBy]);

  const sortLabels = {
    newest: t('cat_sort_newest'),
    popular: t('cat_sort_popular'),
    price_asc: t('cat_sort_price_asc'),
    price_desc: t('cat_sort_price_desc'),
  };

  return (
    <div className="min-h-screen bg-brand-dark text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t('cat_back_home')}
          </Link>
          <h1 className="text-4xl font-bold text-white">{getCatLabel(categoryName)}</h1>
          <p className="text-slate-400 mt-2">
            {products.length}{' '}
            {t('cat_products_found')}
          </p>
        </div>

        {/* Sort controls */}
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label={t('a11y_sort_by')}>
          {(Object.keys(sortLabels) as Array<keyof typeof sortLabels>).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sortBy === key}
              onClick={() => setSortBy(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                sortBy === key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {sortLabels[key]}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">
              {t('cat_no_products')}
            </p>
            <Link href="/" className="mt-4 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
              {t('cat_back_home')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sorted.map((product) => {
              const discountPercent = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                      <Link
                        href={`/product/${product.id}`}
                        className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center hover:bg-indigo-50 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => {
                          addToCart(product);
                          toast.success(t('cart_added'), { icon: '🛒' });
                        }}
                        className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                      {product.isNew && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                          <Sparkles className="w-2.5 h-2.5" />
                          {t('main_badge_new')}
                        </span>
                      )}
                      {product.reviews >= 150 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                          <Flame className="w-2.5 h-2.5" />
                          {t('main_badge_hot')}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <Link href={`/product/${product.id}`} className="mb-2">
                      <h2 className="text-base font-semibold text-white line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
                        {product.title}
                      </h2>
                    </Link>
                    <p className="text-slate-400 text-xs mb-4">
                      {t('main_seller')}: <span className="text-slate-300">{product.author}</span>
                    </p>

                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        {product.originalPrice && (
                          <span className="text-xs text-slate-500 line-through block">
                            {formatPrice(product.originalPrice, currency, exchangeRate)}
                          </span>
                        )}
                        <span className="text-lg font-bold text-white">
                          {formatPrice(product.price, currency, exchangeRate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700/50">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-white">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
