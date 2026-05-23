"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, LayoutDashboard, PlusCircle, Package, TrendingUp, DollarSign, Users, Eye, ArrowUpRight, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  currency: 'USD' | 'UZS';
  exchangeRate: number;
  currentUser: { name: string; email: string } | null;
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

const SellerDashboard: React.FC<SellerDashboardProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onDeleteProduct,
  currency,
  exchangeRate,
  currentUser
}) => {
  const [activeSection, setActiveSection] = useState<'stats' | 'add' | 'my-products'>('stats');
  const { language, t } = useLanguage();
  
  // Preset Unsplash cover templates to make product creation super easy & beautiful
  const IMAGE_TEMPLATES = [
    { name: language === 'uz' ? 'UI Kit / Dizayn' : language === 'ru' ? 'UI Kit / Дизайн' : 'UI Kit / UI Design', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop' },
    { name: language === 'uz' ? 'Koding / Skript' : language === 'ru' ? 'Код / Скрипты' : 'Code / Scripts', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop' },
    { name: language === 'uz' ? 'E-Kitob / Qo\'llanma' : language === 'ru' ? 'Эл. книга / Пособие' : 'E-Book / Guide', url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop' },
    { name: language === 'uz' ? 'Grafika / Blender' : language === 'ru' ? 'Графика / Blender' : 'Graphics / Blender', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' }
  ];

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Dizayn Shablonlari');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(IMAGE_TEMPLATES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key close handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside handler
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Filter products by the current author (the logged-in seller)
  // For demo: match user's name or show newly added ones
  const myUploadedProducts = products.filter(
    (product) => product.author === (currentUser?.name || 'Sotuvchi')
  );

  const getCategoryDisplayName = (catName: string) => {
    const key = categoryTranslations[catName];
    return key ? t(key) : catName;
  };

  const handleAddFeature = (e: React.MouseEvent) => {
    e.preventDefault();
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idxToRemove: number) => {
    setFeatures(features.filter((_, idx) => idx !== idxToRemove));
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price || !description || !fileSize || !fileType) {
      toast.error(language === 'uz' ? "Barcha maydonlarni to'ldiring!" : language === 'ru' ? "Заполните все поля!" : "Please fill out all fields!");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error(language === 'uz' ? "Narx xato kiritildi (musbat son bo'lishi kerak)!" : language === 'ru' ? "Неверная цена (должна быть положительным числом)!" : "Invalid price (must be a positive number)!");
      return;
    }

    const finalImage = customImageUrl.trim() || selectedImageUrl;

    const newProduct: Product = {
      id: Date.now(), // Unique ID
      title,
      category,
      price: priceNum,
      rating: 5.0,
      reviews: 0,
      image: finalImage,
      author: currentUser?.name || 'Sotuvchi',
      description,
      fileSize,
      fileType,
      features: features.length > 0 ? features : ['Raqamli mahsulot', 'Kafolatlangan sifat', 'Tezkor yetkazib berish']
    };

    onAddProduct(newProduct);
    toast.success(language === 'uz' ? "Mahsulot muvaffaqiyatli sotuvga qo'shildi!" : language === 'ru' ? "Продукт успешно добавлен на продажу!" : "Product successfully published for sale!", { icon: '📦' });
    
    // Reset Form
    setTitle('');
    setPrice('');
    setDescription('');
    setFileSize('');
    setFileType('');
    setFeatures([]);
    setCustomImageUrl('');
    
    // Direct user to My Products list
    setActiveSection('my-products');
  };

  const handleDeleteProductClick = (id: number) => {
    onDeleteProduct(id);
    toast.success(language === 'uz' ? "Mahsulot sotuvdan olib tashlandi!" : language === 'ru' ? "Продукт удален с продажи!" : "Product removed from listing!");
  };

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full h-full sm:h-[90vh] max-w-5xl bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 bg-slate-950/40 light:bg-slate-100/50 border-b md:border-b-0 md:border-r border-slate-800 light:border-slate-200 p-4 sm:p-6 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-4">
          <div className="space-y-0 md:space-y-8 flex md:flex-col items-center md:items-stretch justify-between w-full">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-400" />
              <span className="text-white light:text-slate-900 font-bold text-base sm:text-lg">{t('seller_title')}</span>
            </div>
            
            <div className="flex md:flex-col gap-1 sm:gap-2">
              <button
                onClick={() => setActiveSection('stats')}
                className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'stats' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800 hover:bg-slate-800/40 hover:light:bg-slate-200/50'
                }`}
              >
                <LayoutDashboard className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
                <span className="hidden xs:inline">{t('seller_stats')}</span>
              </button>
              <button
                onClick={() => setActiveSection('add')}
                className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'add' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800 hover:bg-slate-800/40 hover:light:bg-slate-200/50'
                }`}
              >
                <PlusCircle className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
                <span className="hidden xs:inline">{t('seller_add_product')}</span>
              </button>
              <button
                onClick={() => setActiveSection('my-products')}
                className={`flex items-center justify-between gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'my-products' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800 hover:bg-slate-800/40 hover:light:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <Package className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
                  <span className="hidden xs:inline">{t('seller_my_products')}</span>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                  activeSection === 'my-products' ? 'bg-white text-indigo-600' : 'bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-600'
                }`}>
                  {myUploadedProducts.length}
                </span>
              </button>
            </div>
          </div>

          <div className="hidden md:block mt-8 pt-4 border-t border-slate-800/80 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white light:text-slate-900 truncate">{currentUser?.name || 'Sotuvchi'}</p>
                <p className="text-[10px] text-slate-550 light:text-slate-500 truncate">{currentUser?.email || 'seller@zetra.uz'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-800 light:border-slate-200 flex justify-between items-center bg-slate-900/60 light:bg-slate-50/80 sticky top-0 backdrop-blur z-10">
            <h2 className="text-lg sm:text-xl font-bold text-white light:text-slate-900">
              {activeSection === 'stats' && t('seller_stats')}
              {activeSection === 'add' && t('seller_add_product')}
              {activeSection === 'my-products' && t('seller_my_products')}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white light:text-slate-500 hover:light:text-slate-850 rounded-xl hover:bg-slate-800 hover:light:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form / Stats Body */}
          <div className="p-4 sm:p-8 flex-1 bg-slate-900 light:bg-slate-50">
            
            {/* 1. STATS SECTION */}
            {activeSection === 'stats' && (
              <div className="space-y-6 sm:space-y-8 animate-fade-in">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-slate-800/40 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-550 light:text-slate-450 uppercase tracking-wider">{t('seller_total_income')}</p>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900 mt-2">
                        {formatPrice(314.50, currency, exchangeRate)}
                      </h3>
                      <p className="text-[10px] text-emerald-450 mt-1 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {language === 'uz' ? '+14.8% bu oy' : language === 'ru' ? '+14.8% в этом месяце' : '+14.8% this month'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 light:border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-400 light:text-indigo-600">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-slate-800/40 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-550 light:text-slate-450 uppercase tracking-wider">{t('seller_sold_count')}</p>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900 mt-2">
                        {language === 'uz' ? '12 ta' : language === 'ru' ? '12 шт' : '12 units'}
                      </h3>
                      <p className="text-[10px] text-emerald-455 mt-1 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {language === 'uz' ? '+8% bu oy' : language === 'ru' ? '+8% в этом месяце' : '+8% this month'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 light:border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-450 light:text-emerald-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-slate-800/40 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-555 light:text-slate-455 uppercase tracking-wider">{t('seller_views_count')}</p>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900 mt-2">
                        {language === 'uz' ? '1 420 ta' : language === 'ru' ? '1 420' : '1,420'}
                      </h3>
                      <p className="text-[10px] text-slate-500 light:text-slate-400 mt-1">{t('seller_views_sub')}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 light:bg-purple-50 border border-purple-500/20 light:border-purple-100 rounded-2xl flex items-center justify-center text-purple-405 light:text-purple-600">
                      <Eye className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* SVG Live Graphic Chart */}
                <div className="bg-slate-800/20 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-4 sm:p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white light:text-slate-900">{t('seller_income_graph')}</h4>
                      <p className="text-xs text-slate-500 light:text-slate-400 mt-0.5">{t('seller_graph_sub')}</p>
                    </div>
                    <div className="text-xs bg-slate-800/80 light:bg-slate-100 text-slate-350 light:text-slate-650 px-3 py-1 rounded-xl border border-slate-700/50 light:border-slate-200">
                      {t('seller_weekly')}
                    </div>
                  </div>
                  
                  {/* SVG Chart */}
                  <div className="relative h-60 w-full bg-slate-950/20 light:bg-slate-50/50 border border-slate-800/60 light:border-slate-200 rounded-2xl flex flex-col justify-end p-6 overflow-hidden">
                    <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-b border-slate-800/30 light:border-slate-250/30 w-full h-full" />
                      ))}
                    </div>
                    {/* SVG Line Chart path */}
                    <svg className="w-full h-full absolute inset-0 text-indigo-500/10" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.25"/>
                          <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M 0 80 Q 15 50 30 70 T 60 30 T 90 20 L 100 15 L 100 100 L 0 100 Z" fill="url(#chartGrad)" />
                      <path d="M 0 80 Q 15 50 30 70 T 60 30 T 90 20 L 100 15" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2.5" />
                    </svg>

                    {/* Chart Labels */}
                    <div className="w-full flex justify-between text-[10px] font-semibold text-slate-550 light:text-slate-400 mt-auto relative z-10 pt-4 border-t border-slate-800/30 light:border-slate-200">
                      {language === 'uz' ? (
                        <>
                          <span>Dush</span>
                          <span>Sesh</span>
                          <span>Chor</span>
                          <span>Pay</span>
                          <span>Jum</span>
                          <span>Shan</span>
                          <span>Yak</span>
                        </>
                      ) : language === 'ru' ? (
                        <>
                          <span>Пн</span>
                          <span>Вт</span>
                          <span>Ср</span>
                          <span>Чт</span>
                          <span>Пт</span>
                          <span>Сб</span>
                          <span>Вс</span>
                        </>
                      ) : (
                        <>
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sales History Log (Mock Log) */}
                <div className="space-y-4">
                  <h4 className="text-sm sm:text-base font-bold text-white light:text-slate-900">{t('seller_sales_history')}</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { item: 'Zamonaviy E-commerce UI Kit', buyer: 'Maftuna S.', date: language === 'uz' ? "Bugun, 09:12" : language === 'ru' ? "Сегодня, 09:12" : "Today, 09:12", earn: 29.99 },
                      { item: 'Telegram Bot Python Script (AI)', buyer: 'Shoxrux T.', date: language === 'uz' ? "Kecha, 18:40" : language === 'ru' ? "Вчера, 18:40" : "Yesterday, 18:40", earn: 49.50 },
                      { item: 'React.js To\'liq Qo\'llanma 2024', buyer: 'Asadbek O.', date: language === 'uz' ? "21-may, 14:10" : language === 'ru' ? "21 мая, 14:10" : "May 21, 14:10", earn: 19.00 }
                    ].map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-slate-850/30 light:bg-white border border-slate-800/60 light:border-slate-200 rounded-2xl text-xs shadow-sm">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200 light:text-slate-800">{log.item}</p>
                          <p className="text-[10px] text-slate-500 light:text-slate-400">
                            {t('seller_buyer')}: <span className="text-slate-400 light:text-slate-605">{log.buyer}</span> • {log.date}
                          </p>
                        </div>
                        <div className="text-right font-bold text-indigo-400 light:text-indigo-600">
                          +{formatPrice(log.earn, currency, exchangeRate)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ADD PRODUCT FORM */}
            {activeSection === 'add' && (
              <form onSubmit={handleProductSubmit} className="space-y-6 max-w-3xl animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('seller_prod_name')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="Masalan: Telegram Bot Python Script (AI)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('seller_prod_cat')}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all cursor-pointer"
                    >
                      <option value="Dizayn Shablonlari">{t('cat_design')}</option>
                      <option value="3D Modellar">{t('cat_3d')}</option>
                      <option value="E-Kitoblar">{t('cat_ebooks')}</option>
                      <option value="Dastur Kodelari">{t('cat_code')}</option>
                      <option value="Grafika & Media">{t('cat_graphics')}</option>
                      <option value="O'yin va Hisoblar">{t('cat_games')}</option>
                      <option value="Litsenziya & Kalitlar">{t('cat_keys')}</option>
                      <option value="Audio & Musiqa">{t('cat_audio')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('seller_price')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="19.99"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('seller_file_size')}
                    </label>
                    <input
                      type="text"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder={t('seller_file_size_placeholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('seller_file_format')}
                    </label>
                    <input
                      type="text"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder={t('seller_file_format_placeholder')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                    {t('seller_description')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-550 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder={t('seller_desc_placeholder')}
                    required
                  />
                </div>

                {/* Features input list */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">
                    {t('seller_features')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      className="block flex-1 px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                      placeholder={t('seller_features_placeholder')}
                    />
                    <button
                      onClick={handleAddFeature}
                      className="px-5 bg-slate-850 light:bg-slate-105 hover:bg-slate-800 hover:light:bg-slate-200 text-slate-250 light:text-slate-800 border border-slate-700/50 light:border-slate-200 rounded-2xl font-semibold transition-colors cursor-pointer text-xs"
                    >
                      {t('seller_features_add')}
                    </button>
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-950/50 light:bg-white border border-slate-800 light:border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-300 light:text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-slate-550 hover:text-red-400 ml-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cover Image Template Select */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">
                    {t('seller_cover_image')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {IMAGE_TEMPLATES.map((img) => (
                      <div 
                        key={img.name}
                        onClick={() => {
                          setSelectedImageUrl(img.url);
                          setCustomImageUrl('');
                        }}
                        className={`relative h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedImageUrl === img.url && !customImageUrl
                            ? 'border-indigo-500 scale-98 shadow-lg shadow-indigo-650/10'
                            : 'border-slate-800 light:border-slate-200 hover:border-slate-700 hover:light:border-slate-300'
                        }`}
                      >
                        <img 
                          src={img.url} 
                          alt={img.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center text-[10px] font-bold text-white">
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative pt-2">
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => {
                        setCustomImageUrl(e.target.value);
                        setSelectedImageUrl('');
                      }}
                      className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-550 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                      placeholder={t('seller_custom_image')}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
                >
                  {t('seller_submit')}
                </button>
              </form>
            )}

            {/* 3. MY PRODUCTS LIST */}
            {activeSection === 'my-products' && (
              <div className="space-y-4 animate-fade-in">
                {myUploadedProducts.length === 0 ? (
                  <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-slate-800/40 light:bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-800 light:border-slate-200 text-slate-500 mx-auto">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white light:text-slate-900">{t('seller_no_products')}</h4>
                      <p className="text-slate-500 text-sm mt-1">{t('seller_no_products_sub')}</p>
                    </div>
                    <button
                      onClick={() => setActiveSection('add')}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      {t('seller_add_first_prod')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {myUploadedProducts.map((product) => (
                      <div key={product.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-850/30 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl gap-4 hover:border-slate-700/60 hover:light:border-slate-350 transition-colors shadow-sm">
                        <div className="flex items-center gap-4">
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700/50 light:border-slate-200"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-200 light:text-slate-800 text-sm line-clamp-1 max-w-xs sm:max-w-md">{product.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-550 light:text-slate-450">
                              <span className="text-slate-400 light:text-slate-600 font-semibold">{getCategoryDisplayName(product.category)}</span>
                              <span>•</span>
                              <span>{language === 'uz' ? 'Hajmi' : language === 'ru' ? 'Размер' : 'Size'}: {product.fileSize}</span>
                              <span>•</span>
                              <span>{language === 'uz' ? 'Format' : language === 'ru' ? 'Формат' : 'Format'}: {product.fileType}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white light:text-slate-900">
                              {formatPrice(product.price, currency, exchangeRate)}
                            </p>
                            <p className="text-[10px] text-slate-550 light:text-slate-500 mt-0.5">{t('seller_rating_rev')}: ⭐ {product.rating} ({product.reviews})</p>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteProductClick(product.id)}
                            className="p-2.5 text-slate-550 light:text-slate-450 hover:text-red-400 hover:light:text-red-655 hover:bg-red-500/10 hover:light:bg-red-50 rounded-xl transition-all cursor-pointer"
                            aria-label="O'chirish"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
