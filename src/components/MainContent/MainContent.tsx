"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingCart, Eye, Sparkles, Flame } from 'lucide-react';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';
import { useLanguage } from '@/context/LanguageContext';
import { getCategoryLabel } from '@/utils/categories';

interface MainContentProps {
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  selectedCategory: string | null;
  onClearFilters: () => void;
  onOpenProductModal: (product: Product) => void;
  currency: 'USD' | 'UZS';
  exchangeRate: number;
  isLoading: boolean;
  products: Product[];
}

const MainContent: React.FC<MainContentProps> = ({ 
  onAddToCart, 
  searchQuery, 
  selectedCategory, 
  onClearFilters,
  onOpenProductModal,
  currency,
  exchangeRate,
  isLoading,
  products
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const { language, t } = useLanguage();

  const getCategoryDisplayName = (catName: string) => getCategoryLabel(catName, t);

  const openProductModal = onOpenProductModal;

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = searchQuery 
      ? product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.reviews - a.reviews;
    }
    return b.id - a.id;
  });

  // Render skeletons when category changes are loading
  if (isLoading) {
    return (
      <div id="products-section" className="bg-slate-900 light:bg-slate-50 py-16 pb-24 border-t border-slate-800 light:border-slate-200 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-10">
            <div className="w-full max-w-sm space-y-3">
              <div className="h-8 bg-slate-800/80 light:bg-slate-200 rounded-2xl w-2/3 animate-pulse" />
              <div className="h-4 bg-slate-800/80 light:bg-slate-200 rounded-xl w-1/2 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-slate-800/80 light:bg-slate-200 rounded-xl w-28 animate-pulse" />
              <div className="h-10 bg-slate-800/80 light:bg-slate-200 rounded-xl w-28 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div key={index} className="bg-slate-800 light:bg-white rounded-2xl overflow-hidden border border-slate-700/50 light:border-slate-200 flex flex-col justify-between h-[390px] p-5 space-y-4 shadow-sm">
                <div className="h-40 bg-slate-700/30 light:bg-slate-100 rounded-xl animate-pulse" />
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-slate-700/30 light:bg-slate-100 rounded w-1/3 animate-pulse" />
                  <div className="h-5 bg-slate-700/30 light:bg-slate-100 rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-slate-700/30 light:bg-slate-100 rounded w-1/2 animate-pulse" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-700/30 light:bg-slate-100 rounded w-10 animate-pulse" />
                    <div className="h-6 bg-slate-700/30 light:bg-slate-100 rounded w-20 animate-pulse" />
                  </div>
                  <div className="h-8 bg-slate-700/30 light:bg-slate-100 rounded-lg w-12 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="products-section" className="bg-slate-900 light:bg-slate-50 py-16 pb-24 border-t border-slate-800 light:border-slate-200 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white light:text-slate-900 mb-2 transition-colors">
              {selectedCategory ? getCategoryDisplayName(selectedCategory) : t('main_new_popular_title')}
            </h2>
            <p className="text-slate-400 light:text-slate-600 transition-colors">
              {searchQuery 
                ? `${t('main_search_results_prefix')}${searchQuery}${t('main_search_results_suffix')}` 
                : t('main_sub_title')}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSortBy('newest')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white light:bg-white light:text-slate-600 light:border-slate-200 light:hover:bg-slate-50 light:hover:text-slate-950'
              }`}
            >
              {t('main_newest')}
            </button>
            <button 
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                sortBy === 'popular'
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white light:bg-white light:text-slate-600 light:border-slate-200 light:hover:bg-slate-50 light:hover:text-slate-950'
              }`}
            >
              {t('main_popular')}
            </button>
          </div>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/10 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-3xl p-8 max-w-md mx-auto shadow-sm transition-colors">
            <p className="text-slate-400 light:text-slate-655 mb-6">{t('main_no_products')}</p>
            <button 
              onClick={onClearFilters}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 active:scale-95 text-sm cursor-pointer"
            >
              {t('clear_filter')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <div key={product.id} className="bg-slate-800 light:bg-white rounded-2xl overflow-hidden border border-slate-700/50 light:border-slate-200 hover:border-indigo-500/50 light:hover:border-indigo-500/30 transition-all duration-300 group hover:shadow-2xl hover:shadow-indigo-500/10 light:hover:shadow-slate-250/80 flex flex-col justify-between h-full">
                {/* Product Image */}
                <div 
                  className="relative h-48 overflow-hidden cursor-pointer flex-shrink-0"
                  onClick={() => openProductModal(product)}
                >
                  <Image 
                    src={product.image} 
                    alt={product.title} 
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openProductModal(product);
                      }}
                      className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center hover:bg-indigo-50 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Badges: Yangi / Ommabop */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                    {product.isNew && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                        <Sparkles className="w-2.5 h-2.5" />
                        {t('main_badge_new')}
                      </span>
                    )}
                    {product.reviews >= 150 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                        <Flame className="w-2.5 h-2.5" />
                        {t('main_badge_hot')}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs font-medium text-white">
                    {getCategoryDisplayName(product.category)}
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 
                      onClick={() => openProductModal(product)}
                      className="text-lg font-semibold text-white light:text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-400 light:group-hover:text-indigo-650 transition-colors cursor-pointer mb-2"
                    >
                      {product.title}
                    </h3>
                    <p className="text-slate-400 light:text-slate-550 text-xs mb-4">
                      {t('main_seller')}: <span className="text-slate-300 light:text-slate-600 hover:text-white light:hover:text-indigo-655 cursor-pointer">{product.author}</span>
                    </p>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col">
                      {product.originalPrice && (
                        <span className="text-xs text-slate-500 light:text-slate-400 line-through">
                          {formatPrice(product.originalPrice, currency, exchangeRate)}
                        </span>
                      )}
                      <span className="text-xl font-bold text-white light:text-slate-900 transition-colors">
                        {formatPrice(product.price, currency, exchangeRate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900/50 light:bg-slate-50 px-2 py-1 rounded-lg border border-slate-700/50 light:border-slate-200">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-white light:text-slate-800 transition-colors">{product.rating}</span>
                      <span className="text-xs text-slate-500 light:text-slate-400">({product.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(searchQuery || selectedCategory) && sortedProducts.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={onClearFilters}
              className="px-8 py-3 bg-slate-800 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white light:bg-white light:text-slate-700 light:border-slate-200 light:hover:bg-indigo-600 light:hover:text-white text-slate-300 border border-slate-700 rounded-xl font-medium transition-all cursor-pointer shadow-md light:shadow-slate-200/50"
            >
              {t('main_all_products_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;
