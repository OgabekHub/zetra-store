"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, LayoutDashboard, PlusCircle, Package, TrendingUp, DollarSign, Eye, ArrowUpRight, Trash2, CheckCircle2, ChevronDown, Shield, ShieldAlert, ShieldCheck, RotateCcw, Loader2 } from 'lucide-react';
import { Product } from '@/data/products';
import { UserProfile, Currency } from '@/types';
import Image from 'next/image';
import { formatPrice } from '@/utils/price';
import { parseSellerPrice } from '@/utils/money';
import { SELLER_LIMITS, validateSellerProduct } from '@/utils/validation';
import { pickLocalized } from '@/utils/locale';
import { isAllowedImageUrl, allowedImageHostsLabel } from '@/utils/images';
import { nextProductId } from '@/store/catalogStore';
import { getCategoryLabel, ALL_CATEGORIES } from '@/utils/categories';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import { useModalA11y } from '@/hooks/useModalA11y';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  currency: Currency;
  exchangeRate: number;
  currentUser: UserProfile | null;
}



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
    { name: t('seller_ui_kit_ui_design'), url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop' },
    { name: t('seller_code_scripts'), url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop' },
    { name: t('seller_e_book_guide'), url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop' },
    { name: t('seller_graphics_blender'), url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' }
  ];

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Dizayn Shablonlari');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(IMAGE_TEMPLATES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Antivirus Scan states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'clean' | 'infected'>('idle');
  const scanConsoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll scan logs console
  useEffect(() => {
    if (isScanning) {
      scanConsoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLogs, isScanning]);

  // Chart states and data
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const chartData = [
    { dayUz: 'Dush', dayRu: 'Пн', dayEn: 'Mon', valueUsd: 120 },
    { dayUz: 'Sesh', dayRu: 'Вт', dayEn: 'Tue', valueUsd: 240 },
    { dayUz: 'Chor', dayRu: 'Ср', dayEn: 'Wed', valueUsd: 180 },
    { dayUz: 'Pay',  dayRu: 'Чт', dayEn: 'Thu', valueUsd: 480 },
    { dayUz: 'Jum',  dayRu: 'Пт', dayEn: 'Fri', valueUsd: 890 },
    { dayUz: 'Shan', dayRu: 'Сб', dayEn: 'Sat', valueUsd: 710 },
    { dayUz: 'Yak',  dayRu: 'Вс', dayEn: 'Sun', valueUsd: 790 },
  ];

  // Coordinates calculation for SVG viewBox="0 0 100 100"
  // Padding left/right: 6%, padding bottom: 15%, top: 15%
  const chartPoints = chartData.map((d, i) => {
    const x = 6 + i * 14.6; // evenly distributed from 6 to 94
    const y = 85 - (d.valueUsd / 1000) * 70; // mapped to height limits
    return { x, y, ...d };
  });

  // Generate cubic bezier curve path
  let pathD = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
  for (let i = 0; i < chartPoints.length - 1; i++) {
    const p0 = chartPoints[i];
    const p1 = chartPoints[i + 1];
    const cpX1 = p0.x + 7.3;
    const cpY1 = p0.y;
    const cpX2 = p1.x - 7.3;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }

  const fillD = `${pathD} L ${chartPoints[chartPoints.length - 1].x} 88 L ${chartPoints[0].x} 88 Z`;

  const formatYValue = (valUsd: number) => {
    if (currency === 'UZS') {
      const valUzs = valUsd * exchangeRate;
      if (valUzs >= 1000000) {
        return `${(valUzs / 1000000).toFixed(1)}M`;
      }
      return `${Math.round(valUzs / 1000)}k`;
    }
    return `$${valUsd}`;
  };

  const formatTooltipValue = (valUsd: number) => {
    // `formatPrice` kursga o'zi ko'paytiradi. Avval bu yerda qiymat oldindan
    // ham ko'paytirilardi, natijada maslahat `kurs²` ko'rsatib, yonidagi
    // Y o'qidan 12 800 barobar farq qilardi.
    return formatPrice(valUsd, currency, exchangeRate);
  };

  // Scroll qulfi, ESC, fokus tuzog'i va fokusni tiklash — hammasi
  // umumiy hook'da. Avval bu blok olti faylda takrorlangan edi.
  const { backdropProps, panelProps } = useModalA11y({
    isOpen,
    onClose,
    label: t('seller_panel_title'),
  });

  // Skan/yuklash taymeri ref'da: modal yopilganda u albatta to'xtatiladi.
  // Avval interval lokal o'zgaruvchida edi va modalni yarim yo'lda
  // yopsangiz ham ~4.6 soniyadan keyin mahsulotni katalogga qo'shib
  // yuborardi.
  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const publishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (scanTimer.current !== null) clearInterval(scanTimer.current);
      if (publishTimer.current !== null) clearTimeout(publishTimer.current);
    },
    [],
  );




  if (!isOpen) return null;

  // Filter products by the current author (the logged-in seller)
  // For demo: match user's name or show newly added ones
  const myUploadedProducts = products.filter(
    (product) => product.author === (currentUser?.name || 'Sotuvchi')
  );

  const getCategoryDisplayName = (catName: string) => getCategoryLabel(catName, t);

  const handleAddFeature = (e: React.MouseEvent) => {
    e.preventDefault();
    if (featureInput.trim()) {
      if (features.length >= SELLER_LIMITS.features) {
        toast.error(t('seller_too_many_features'));
        return;
      }
      setFeatures([...features, featureInput.trim().slice(0, SELLER_LIMITS.feature)]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idxToRemove: number) => {
    setFeatures(features.filter((_, idx) => idx !== idxToRemove));
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Matn maydonlari tozalanadi va uzunligi cheklanadi. Avval hech qanday
    // chegara yo'q edi: megabaytlik tavsif localStorage kvotasini to'ldirardi.
    const validation = validateSellerProduct({ title, description, fileSize, fileType, features });
    if (!validation.ok) {
      toast.error(
        t(
          validation.reason === 'required'
            ? 'auth_please_fill_out_all_fields'
            : validation.reason === 'too-many'
              ? 'seller_too_many_features'
              : 'seller_field_too_long',
        ),
      );
      return;
    }
    const cleanText = validation.value;

    const priceNum = parseSellerPrice(price);
    if (priceNum === null) {
      toast.error(t('seller_invalid_price_must_be_a_positive_numbe'));
      return;
    }

    const priceNumVal: number = priceNum;

    // Sotuvchi kiritgan manzil `next.config.ts` ruxsat bergan hostda
    // bo'lishi shart: aks holda `next/image` render paytida istisno
    // tashlaydi va butun mahsulot jadvali oq ekranga aylanadi.
    const chosenImage = customImageUrl.trim() || selectedImageUrl;
    if (!isAllowedImageUrl(chosenImage)) {
      toast.error(`${t('seller_image_url_invalid')} (${allowedImageHostsLabel()})`);
      return;
    }

    // Intercept upload to run antivirus scanner
    const targetFileLabel = (title + " " + fileType + " " + description).toLowerCase();
    const willBeInfected = targetFileLabel.includes('malware') || 
                           targetFileLabel.includes('virus') || 
                           targetFileLabel.includes('trojan') || 
                           targetFileLabel.includes('.exe') ||
                           targetFileLabel.includes('dangerous') ||
                           targetFileLabel.includes('exploit');

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('scanning');
    
    const logsUZ = [
      "Fayl serverga yuklanmoqda (Zetra Sandbox v2.4)...",
      "MD5/SHA-256 xesh summalari hisoblanmoqda...",
      "Demo: haqiqiy xesh hisoblanmaydi",
      "Demo tekshiruvi: tashqi antivirus bazalari ishlatilmaydi...",
      "Sun'iy intellekt modeli yordamida statik va dinamik kod tahlili boshlandi...",
      "Hevristik algoritm yordamida shubhali buyruqlar va exploitlar tekshirilmoqda..."
    ];
    
    const logsRU = [
      "Загрузка файла на сервер (Песочница Zetra v2.4)...",
      "Вычисление хэш-сумм MD5/SHA-256...",
      "Демо: реальный хэш не вычисляется",
      "Демо-проверка: внешние антивирусные базы не используются...",
      "Запуск ИИ-модели для статического и динамического анализа кода...",
      "Эвристический анализ на наличие подозрительных вызовов и эксплойтов..."
    ];

    const logsEN = [
      "Uploading file to secure sandbox (Zetra Sandbox v2.4)...",
      "Calculating MD5/SHA-256 checksum hashes...",
      "Demo: no real hash is computed",
      "Demo check: no external antivirus database is used...",
      "Running AI-powered static and dynamic code structures analyzer...",
      "Heuristic analysis for suspicious commands and memory exploits..."
    ];

    const getLogText = (index: number) => {
      return pickLocalized(language, { uz: logsUZ, ru: logsRU, en: logsEN })[index] || '';
    };

    setScanLogs([getLogText(0)]);

    let currentProgress = 0;
    scanTimer.current = setInterval(() => {
      currentProgress += 5;
      if (currentProgress <= 100) {
        setScanProgress(currentProgress);
        
        if (currentProgress === 20) {
          setScanLogs(prev => [...prev, getLogText(1), getLogText(2)]);
        } else if (currentProgress === 50) {
          setScanLogs(prev => [...prev, getLogText(3)]);
        } else if (currentProgress === 75) {
          setScanLogs(prev => [...prev, getLogText(4), getLogText(5)]);
        }
      } else {
        if (scanTimer.current !== null) clearInterval(scanTimer.current);
        
        if (willBeInfected) {
          setScanStatus('infected');
          const infectLog = t('seller_security_threat_detected_trojan_downlo');
          const blockLog = t('seller_security_policy_violation_file_upload_');
          setScanLogs(prev => [...prev, infectLog, blockLog]);
          toast.error(
            t('seller_threat_detected_file_upload_cancelled'), 
            { icon: '🛡️' }
          );
        } else {
          setScanStatus('clean');
          const cleanLog = t('seller_safe_no_malware_or_exploit_patterns_de');
          const publishLog = t('seller_publishing_product_to_zetra_store_cata');
          setScanLogs(prev => [...prev, cleanLog, publishLog]);

          publishTimer.current = setTimeout(() => {
            const newProduct: Product = {
              // `Date.now()` to'qnashuvga qarshi kafolat bermasdi va fixture
              // id lari bilan bir fazoda emas edi.
              id: nextProductId(),
              title: cleanText.title,
              category,
              price: priceNumVal,
              rating: 5.0,
              reviews: 0,
              image: chosenImage,
              // `createdAt` va `isNew` avval berilmasdi. Natijada kategoriya
              // sahifasidagi "Yangi" saralashi `NaN` qaytaradigan taqqoslash
              // bilan ishlardi.
              createdAt: new Date().toISOString(),
              isNew: true,
              origin: 'local',
              author: currentUser?.name || 'Sotuvchi',
              description: cleanText.description,
              fileSize: cleanText.fileSize,
              fileType: cleanText.fileType,
              features: cleanText.features.length > 0 ? cleanText.features : ['Raqamli mahsulot', 'Kafolatlangan sifat', 'Tezkor yetkazib berish']
            };

            onAddProduct(newProduct);
            toast.success(
              t('seller_product_successfully_published_for_sal'), 
              { icon: '📦' }
            );

            setTitle('');
            setPrice('');
            setDescription('');
            setFileSize('');
            setFileType('');
            setFeatures([]);
            setCustomImageUrl('');
            setIsScanning(false);
            setScanStatus('idle');
            setActiveSection('my-products');
          }, 1500);
        }
      }
    }, 150);
  };

  const handleDeleteProductClick = (id: number) => {
    onDeleteProduct(id);
    toast.success(t('seller_product_removed_from_listing'));
  };

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div 
        {...panelProps}
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
                        {t('seller_14_8_this_month')}
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
                        {t('seller_12_units')}
                      </h3>
                      <p className="text-[10px] text-emerald-455 mt-1 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {t('seller_8_this_month')}
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
                        {t('seller_1_420')}
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
                  
                  {/* Interactive Chart Wrapper */}
                  <div className="relative h-64 w-full bg-slate-950/20 light:bg-slate-50/50 border border-slate-800/60 light:border-slate-200 rounded-2xl flex items-stretch p-4 overflow-hidden">
                    {/* Y-Axis Grid Labels */}
                    <div className="w-10 flex flex-col justify-between text-[9px] font-bold text-slate-500 light:text-slate-400 pb-8 pr-1.5 text-right select-none z-10 border-r border-slate-800/20 light:border-slate-200/50">
                      <span>{formatYValue(1000)}</span>
                      <span>{formatYValue(750)}</span>
                      <span>{formatYValue(500)}</span>
                      <span>{formatYValue(250)}</span>
                      <span>{formatYValue(0)}</span>
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 relative flex flex-col justify-end pl-2">
                      {/* Horizontal Grid lines */}
                      <div className="absolute inset-0 grid grid-rows-4 pointer-events-none pr-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="border-b border-slate-800/20 light:border-slate-250/20 w-full h-full" />
                        ))}
                      </div>

                      {/* SVG Drawing Area */}
                      <div className="relative flex-1 w-full h-full min-h-[160px]">
                        {/* SVG Line and Area (Stretched safely for paths only) */}
                        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradBrand" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00F2C2" stopOpacity="0.22"/>
                              <stop offset="100%" stopColor="#00F2C2" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          {/* Area fill */}
                          <path d={fillD} fill="url(#chartGradBrand)" />
                          {/* Stroke line */}
                          <path d={pathD} fill="none" stroke="#00F2C2" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>

                        {/* HTML Overlay: Vertical Guides, Data Circles, and Tooltips */}
                        
                        {/* Hover highlight line */}
                        {hoveredPoint !== null && (
                          <div 
                            className="absolute top-2 bottom-8 w-[1.5px] border-l border-dashed border-[#00F2C2]/40 pointer-events-none transition-all duration-150"
                            style={{ left: `${chartPoints[hoveredPoint].x}%` }}
                          />
                        )}

                        {/* Data Circles */}
                        {chartPoints.map((p, i) => (
                          <div
                            key={i}
                            className={`absolute w-3.5 h-3.5 rounded-full border-2 border-[#00F2C2] bg-slate-950 light:bg-white transition-all duration-150 pointer-events-none z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 ${
                              hoveredPoint === i ? 'scale-125 ring-4 ring-[#00F2C2]/30 shadow-[0_0_8px_rgba(0,242,194,0.6)]' : ''
                            }`}
                            style={{
                              left: `${p.x}%`,
                              top: `${p.y}%`,
                            }}
                          >
                            {/* Inner center dot when hovered */}
                            {hoveredPoint === i && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00F2C2]" />
                            )}
                          </div>
                        ))}

                        {/* Transparent Hover Columns (Slices) */}
                        {chartPoints.map((p, i) => (
                          <div
                            key={i}
                            aria-hidden="true"
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            className="absolute top-0 bottom-6 cursor-pointer z-25"
                            style={{
                              left: `${p.x - 7.3}%`,
                              width: '14.6%',
                            }}
                          />
                        ))}

                        {/* Hover Tooltip inside Chart */}
                        {hoveredPoint !== null && (
                          <div 
                            className="absolute bg-slate-900/95 light:bg-white border border-[#00F2C2]/45 rounded-xl px-2.5 py-1.5 shadow-2xl text-center pointer-events-none z-30 transition-all duration-150 animate-fade-in"
                            style={{ 
                              left: `${chartPoints[hoveredPoint].x}%`, 
                              top: `${chartPoints[hoveredPoint].y}%`,
                              transform: 'translate(-50%, -125%)'
                            }}
                          >
                            <p className="text-[9px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">
                              {pickLocalized(language, { uz: chartPoints[hoveredPoint].dayUz, ru: chartPoints[hoveredPoint].dayRu, en: chartPoints[hoveredPoint].dayEn })}
                            </p>
                            <p className="text-xs font-black text-[#00F2C2] light:text-[#00a383] mt-0.5 whitespace-nowrap">
                              {formatTooltipValue(chartPoints[hoveredPoint].valueUsd)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Chart X-Axis Labels */}
                      <div className="w-full relative h-6 mt-2 pt-2 border-t border-slate-800/20 light:border-slate-200 select-none">
                        {chartPoints.map((p, i) => (
                          <span 
                            key={i} 
                            className={`absolute text-[10px] font-bold text-slate-550 light:text-slate-400 transition-colors -translate-x-1/2 ${
                              hoveredPoint === i ? 'text-[#00F2C2] light:text-[#00a383] font-extrabold scale-105' : ''
                            }`}
                            style={{ left: `${p.x}%` }}
                          >
                            {pickLocalized(language, { uz: p.dayUz, ru: p.dayRu, en: p.dayEn })}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales History Log (Mock Log) */}
                <div className="space-y-4">
                  <h4 className="text-sm sm:text-base font-bold text-white light:text-slate-900">{t('seller_sales_history')}</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { item: 'Zamonaviy E-commerce UI Kit', buyer: 'Maftuna S.', date: t('seller_today_09_12'), earn: 29.99 },
                      { item: 'Telegram Bot Python Script (AI)', buyer: 'Shoxrux T.', date: t('seller_yesterday_18_40'), earn: 49.50 },
                      { item: 'React.js To\'liq Qo\'llanma 2024', buyer: 'Asadbek O.', date: t('seller_may_21_14_10'), earn: 19.00 }
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

            {/* 2. ADD PRODUCT FORM OR ANTIVIRUS SCANNING */}
            {activeSection === 'add' && (
              isScanning ? (
                <div className="bg-slate-950/20 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in shadow-sm transition-all duration-300">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all ${
                      scanStatus === 'scanning'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse'
                        : scanStatus === 'clean'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 scale-105'
                          : 'bg-red-500/10 border-red-500/20 text-red-400 animate-bounce'
                    }`}>
                      {scanStatus === 'scanning' && <Loader2 className="w-8 h-8 animate-spin" />}
                      {scanStatus === 'clean' && <ShieldCheck className="w-8 h-8" />}
                      {scanStatus === 'infected' && <ShieldAlert className="w-8 h-8 text-red-500" />}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white light:text-slate-900 flex items-center justify-center gap-2">
                        <Shield className="w-4.5 h-4.5 text-indigo-400" />
                        {t('scan_title')}
                      </h3>
                      <p className="text-xs text-slate-450 light:text-slate-505">
                        {scanStatus === 'scanning' && t('scan_running')}
                        {scanStatus === 'clean' && t('scan_clean')}
                        {scanStatus === 'infected' && t('scan_infected')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-455 light:text-slate-650">
                      <span>{t('seller_scanning_progress')}</span>
                      <span className={`${scanStatus === 'infected' ? 'text-red-400' : 'text-indigo-400'}`}>{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 light:bg-slate-200 border border-slate-800 light:border-slate-300/60 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-150 ${
                          scanStatus === 'infected' 
                            ? 'bg-red-500' 
                            : scanStatus === 'clean'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-600'
                        }`}
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                      {t('seller_scanner_report_logs')}
                    </label>
                    <div className="h-44 bg-slate-955 light:bg-slate-950 border border-slate-850 light:border-slate-300/40 rounded-2xl p-4 overflow-y-auto font-mono text-[10px] space-y-1.5 leading-normal text-slate-300 light:text-slate-700 select-text">
                      {scanLogs.map((log, idx) => {
                        const isInfect = log.startsWith('❌') || log.startsWith('[XAVFLI]');
                        const isClean = log.startsWith('✔');
                        return (
                          <div 
                            key={idx} 
                            className={`flex gap-2 items-start ${
                              isInfect 
                                ? 'text-red-400 font-bold' 
                                : isClean 
                                  ? 'text-emerald-400 font-bold' 
                                  : 'text-slate-400 light:text-slate-500'
                            }`}
                          >
                            <span className="select-none text-slate-700 font-mono">[{idx + 1}]</span>
                            <span className="whitespace-pre-wrap">{log}</span>
                          </div>
                        );
                      })}
                      <div ref={scanConsoleEndRef} />
                    </div>
                  </div>

                  {scanStatus === 'infected' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsScanning(false);
                        setScanStatus('idle');
                      }}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-white light:text-slate-900 rounded-2xl font-bold transition-all border border-slate-700/40 light:border-slate-300 active:scale-[0.98] text-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {t('scan_try_again')}
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleProductSubmit} className="space-y-6 max-w-3xl animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('seller_prod_name')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      maxLength={SELLER_LIMITS.title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="Masalan: Telegram Bot Python Script (AI)"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('seller_prod_cat')}
                    </label>
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isCategoryDropdownOpen}
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="flex items-center justify-between w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all cursor-pointer text-left"
                    >
                      <span>{getCategoryDisplayName(category)}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryDropdownOpen && (
                      <>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="fixed inset-0 z-40 cursor-default"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        />
                        <div role="listbox" aria-label={t('seller_prod_cat')} className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-950 light:bg-white shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                          {ALL_CATEGORIES.map((catName) => (
                            <button
                              key={catName}
                              type="button"
                              role="option"
                              aria-selected={category === catName}
                              onClick={() => {
                                setCategory(catName);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`flex items-center w-full px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                                category === catName
                                  ? 'bg-indigo-600 text-white font-semibold'
                                  : 'text-slate-300 light:text-slate-700 hover:bg-slate-900 light:hover:bg-slate-100'
                              }`}
                            >
                              {getCategoryDisplayName(catName)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
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
                      maxLength={SELLER_LIMITS.fileSize}
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
                      maxLength={SELLER_LIMITS.fileType}
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
                    maxLength={SELLER_LIMITS.description}
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
                      maxLength={SELLER_LIMITS.feature}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      className="block flex-1 px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                      placeholder={t('seller_features_placeholder')}
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-5 bg-slate-800 hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-white light:text-slate-900 border border-slate-700/50 light:border-slate-300 rounded-2xl font-bold transition-all cursor-pointer text-xs active:scale-95 shadow-sm"
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
                      <button type="button" aria-pressed={selectedImageUrl === img.url && !customImageUrl} 
                        key={img.name}
                        onClick={() => {
                          setSelectedImageUrl(img.url);
                          setCustomImageUrl('');
                        }}
                        className={`block w-full relative h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedImageUrl === img.url && !customImageUrl
                            ? 'border-indigo-500 scale-98 shadow-lg shadow-indigo-650/10'
                            : 'border-slate-800 light:border-slate-200 hover:border-slate-700 hover:light:border-slate-300'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={img.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center text-[10px] font-bold text-white">
                          {img.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="relative pt-2">
                    <input
                      type="text"
                      value={customImageUrl}
                      maxLength={2048}
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
            )
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
                          <Image
                            src={product.image}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700/50 light:border-slate-200"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-200 light:text-slate-800 text-sm line-clamp-1 max-w-xs sm:max-w-md">{product.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-550 light:text-slate-450">
                              <span className="text-slate-400 light:text-slate-600 font-semibold">{getCategoryDisplayName(product.category)}</span>
                              <span>•</span>
                              <span>{t('seller_size')}: {product.fileSize}</span>
                              <span>•</span>
                              <span>{t('prod_format')}: {product.fileType}</span>
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
                            aria-label={t('a11y_delete')}
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
