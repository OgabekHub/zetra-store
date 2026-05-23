"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, LayoutDashboard, PlusCircle, Package, TrendingUp, DollarSign, Users, Eye, ArrowUpRight, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';

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

// Preset Unsplash cover templates to make product creation super easy & beautiful
const IMAGE_TEMPLATES = [
  { name: 'UI Kit / Dizayn', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop' },
  { name: 'Koding / Skript', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop' },
  { name: 'E-Kitob / Qo\'llanma', url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop' },
  { name: 'Grafika / Blender', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' }
];

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
      toast.error('Barcha maydonlarni to\'ldiring!');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Narx xato kiritildi (musbat son bo\'lishi kerak)!');
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
    toast.success('Mahsulot muvaffaqiyatli sotuvga qo\'shildi!', { icon: '📦' });
    
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
    toast.success('Mahsulot sotuvdan olib tashlandi!');
  };

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] md:flex-row"
      >
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 bg-slate-950/40 border-r border-slate-800 p-6 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-400" />
              <span className="text-white font-bold text-lg">Sotuvchi Paneli</span>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setActiveSection('stats')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'stats' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                Statistika & Tahlillar
              </button>
              <button
                onClick={() => setActiveSection('add')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'add' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <PlusCircle className="w-4.5 h-4.5" />
                Mahsulot qo'shish
              </button>
              <button
                onClick={() => setActiveSection('my-products')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'my-products' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4.5 h-4.5" />
                  Mening mahsulotlarim
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeSection === 'my-products' ? 'bg-white text-indigo-600' : 'bg-slate-800 text-slate-400'
                }`}>
                  {myUploadedProducts.length}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Sotuvchi'}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser?.email || 'seller@zetra.uz'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 sticky top-0 backdrop-blur z-10">
            <h2 className="text-xl font-bold text-white">
              {activeSection === 'stats' && 'Sotuvlar Ko\'rsatkichlari'}
              {activeSection === 'add' && 'Yangi Mahsulot Yuklash'}
              {activeSection === 'my-products' && 'Yuklangan Mahsulotlar'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form / Stats Body */}
          <div className="p-8 flex-1">
            
            {/* 1. STATS SECTION */}
            {activeSection === 'stats' && (
              <div className="space-y-8 animate-fade-in">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jami daromad</p>
                      <h3 className="text-2xl font-extrabold text-white mt-2">
                        {formatPrice(314.50, currency, exchangeRate)}
                      </h3>
                      <p className="text-[10px] text-emerald-450 mt-1 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +14.8% bu oy
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sotilgan mahsulotlar</p>
                      <h3 className="text-2xl font-extrabold text-white mt-2">12 ta</h3>
                      <p className="text-[10px] text-emerald-455 mt-1 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +8% bu oy
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-450">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ko'rishlar jami</p>
                      <h3 className="text-2xl font-extrabold text-white mt-2">1 420 ta</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Noyob kirishlar soni</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-405">
                      <Eye className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* SVG Live Graphic Chart */}
                <div className="bg-slate-800/20 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-base font-bold text-white">Daromad Grafigi (Oxirgi 7 kun)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Haqiqiy sotuvlar mantiqi bo'yicha</p>
                    </div>
                    <div className="text-xs bg-slate-800/80 px-3 py-1 rounded-xl text-slate-350 border border-slate-700/50">
                      Haftalik
                    </div>
                  </div>
                  
                  {/* SVG Chart */}
                  <div className="relative h-60 w-full bg-slate-950/20 border border-slate-800/60 rounded-2xl flex flex-col justify-end p-6 overflow-hidden">
                    <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-b border-slate-800/30 w-full h-full" />
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
                    <div className="w-full flex justify-between text-[10px] font-semibold text-slate-550 mt-auto relative z-10 pt-4 border-t border-slate-800/30">
                      <span>Dush</span>
                      <span>Sesh</span>
                      <span>Chor</span>
                      <span>Pay</span>
                      <span>Jum</span>
                      <span>Shan</span>
                      <span>Yak</span>
                    </div>
                  </div>
                </div>

                {/* Sales History Log (Mock Log) */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white">Sotuvlar Tarixi</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { item: 'Zamonaviy E-commerce UI Kit', buyer: 'Maftuna S.', date: 'Bugun, 09:12', earn: 29.99 },
                      { item: 'Telegram Bot Python Script (AI)', buyer: 'Shoxrux T.', date: 'Kecha, 18:40', earn: 49.50 },
                      { item: 'React.js To\'liq Qo\'llanma 2024', buyer: 'Asadbek O.', date: '21-may, 14:10', earn: 19.00 }
                    ].map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-slate-850/30 border border-slate-800/60 rounded-2xl text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200">{log.item}</p>
                          <p className="text-[10px] text-slate-500">
                            Xaridor: <span className="text-slate-400">{log.buyer}</span> • {log.date}
                          </p>
                        </div>
                        <div className="text-right font-bold text-indigo-400">
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Mahsulot nomi
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="Masalan: Telegram Bot Python Script (AI)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Kategoriya
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    >
                      <option value="Dizayn Shablonlari">Dizayn Shablonlari</option>
                      <option value="E-Kitoblar">E-Kitoblar</option>
                      <option value="Dastur Kodelari">Dastur Kodelari</option>
                      <option value="Litsenziya & Kalitlar">Litsenziya & Kalitlar</option>
                      <option value="Grafika & Media">Grafika & Media</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Narxi (USD da)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="19.99"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Fayl hajmi
                    </label>
                    <input
                      type="text"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="Masalan: 45.2 MB"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Fayl formati
                    </label>
                    <input
                      type="text"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="Masalan: ZIP Archive"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Mahsulot tavsifi
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder="Mahsulot haqida to'liqroq ma'lumot bering..."
                    required
                  />
                </div>

                {/* Features input list */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Asosiy afzalliklari (Features)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      className="block flex-1 px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                      placeholder="Masalan: Umrbod yangilanishlar"
                    />
                    <button
                      onClick={handleAddFeature}
                      className="px-5 bg-slate-850 hover:bg-slate-800 text-slate-250 border border-slate-700/50 rounded-2xl font-semibold transition-colors cursor-pointer text-xs"
                    >
                      Qo'shish
                    </button>
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-slate-500 hover:text-red-400 ml-1"
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mahsulot muqova rasmi
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
                            : 'border-slate-800 hover:border-slate-700'
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
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                      placeholder="Yoki o'zingizning rasm havolangizni (URL) kiriting"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
                >
                  Mahsulotni yuklash
                </button>
              </form>
            )}

            {/* 3. MY PRODUCTS LIST */}
            {activeSection === 'my-products' && (
              <div className="space-y-4 animate-fade-in">
                {myUploadedProducts.length === 0 ? (
                  <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-slate-800/40 rounded-2xl flex items-center justify-center border border-slate-800 text-slate-500 mx-auto">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white">Mahsulotlaringiz yo'q</h4>
                      <p className="text-slate-500 text-sm mt-1">Siz hali hech qanday raqamli mahsulotni sotuvga qo'ymadingiz.</p>
                    </div>
                    <button
                      onClick={() => setActiveSection('add')}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Birinchi mahsulotni qo'shish
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {myUploadedProducts.map((product) => (
                      <div key={product.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-850/30 border border-slate-800 rounded-2xl gap-4 hover:border-slate-700/60 transition-colors">
                        <div className="flex items-center gap-4">
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700/50"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-200 text-sm line-clamp-1 max-w-xs sm:max-w-md">{product.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                              <span className="text-slate-400 font-semibold">{product.category}</span>
                              <span>•</span>
                              <span>Hajmi: {product.fileSize}</span>
                              <span>•</span>
                              <span>Format: {product.fileType}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">
                              {formatPrice(product.price, currency, exchangeRate)}
                            </p>
                            <p className="text-[10px] text-slate-550 mt-0.5">Baholash: ⭐ {product.rating} ({product.reviews})</p>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteProductClick(product.id)}
                            className="p-2.5 text-slate-550 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
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
