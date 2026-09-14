"use client";

import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { ShoppingCart, Search, Menu, User, LogOut, Languages, Sun, Moon, Home, Compass } from 'lucide-react';
import Image from 'next/image';
import zetraLogoDark from '../../assets/images/zetra-logo-dark.png';
import zetraLogoLight from '../../assets/images/zetra-logo-light.png';
import type { CartItem, UserProfile, Product, Currency } from '@/types';
import { formatPrice, formatExchangeRate } from '@/utils/price';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { Language } from '@/context/LanguageContext';

/** Til tanlash variantlari: olti marta takrorlangan tugma bloklari o'rniga bitta ro'yxat. */
const LANGUAGE_OPTIONS: readonly { code: Language; nativeName: string; flag: string; toastKey: string }[] = [
  { code: 'uz', nativeName: "O'zbekcha", flag: '🇺🇿', toastKey: 'lang_switched_uz' },
  { code: 'ru', nativeName: 'Русский', flag: '🇷🇺', toastKey: 'lang_switched_ru' },
  { code: 'en', nativeName: 'English', flag: '🇺🇸', toastKey: 'lang_switched_en' },
];


interface NavbarProps {
  cartItems: CartItem[];
  setIsCartOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenProductModal: (product: Product) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  products: Product[];
  onOpenSeller: () => void;
  onOpenProfileSettings: () => void;
  onOpenMyPurchases: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  cartItems = [], 
  setIsCartOpen, 
  searchQuery, 
  setSearchQuery,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenProductModal,
  currency,
  setCurrency,
  exchangeRate,
  products = [],
  onOpenSeller,
  onOpenProfileSettings,
  onOpenMyPurchases
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const zetraLogo = theme === 'dark' ? zetraLogoDark : zetraLogoLight;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Search click outside
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSuggestions(false);
      }

      // User dropdown click outside
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setIsUserDropdownOpen(false);
      }

      // Language dropdown click outside
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setShowSuggestions(false);
        setIsUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to products section
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
    
    const element = document.getElementById('products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter suggestions
  // Bitta predikat, ikkita natija.
  //
  // Avval takliflar ro'yxati `description` bo'yicha ham qidirardi,
  // "Barcha mahsulotlar (N)" tugmasidagi son esa qidirmasdi — tugma "(3)"
  // deb turar, jadval esa 7 ta natija ko'rsatardi.
  const matches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const suggestions = useMemo(() => matches.slice(0, 5), [matches]);
  const totalMatches = matches.length;

  // Qidiruv WAI-ARIA combobox naqshida: fokus maydonda qoladi, strelkalar
  // faol taklifni almashtiradi, Enter uni ochadi. Avval takliflarga faqat
  // sichqoncha bilan yetib borish mumkin edi.
  const searchId = useId();
  const listboxId = `${searchId}-listbox`;
  const optionId = (productId: number) => `${searchId}-option-${productId}`;
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestionsVisible = showSuggestions && searchQuery.trim() !== '' && suggestions.length > 0;
  const activeProduct = activeSuggestion >= 0 ? suggestions[activeSuggestion] : undefined;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsVisible) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (e.key === 'Enter' && activeProduct) {
      e.preventDefault();
      onOpenProductModal(activeProduct);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-slate-900/80 light:bg-white/85 backdrop-blur-md border-b border-slate-800 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <button type="button" aria-label={t('nav_home')} 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setSearchQuery('');
            }}
            className="flex-shrink-0 flex items-center cursor-pointer"
          >
            <Image 
              src={zetraLogo} 
              alt="Zetra Logo"
              className="h-9 md:h-12 w-auto object-contain transition-all"
              sizes="(max-width: 768px) 96px, 128px"
              fetchPriority="high"
            />
          </button>

          {/* Search Bar - Always Visible */}
          <div ref={searchRef} className="flex flex-1 max-w-2xl ml-3 md:mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                role="combobox"
                aria-label={t('search')}
                aria-autocomplete="list"
                aria-expanded={suggestionsVisible}
                aria-controls={listboxId}
                aria-activedescendant={activeProduct ? optionId(activeProduct.id) : undefined}
                autoComplete="off"
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveSuggestion(-1);
                  setShowSuggestions(true);
                }}
                className="block w-full pl-9 md:pl-10 pr-3 py-2 md:py-2.5 border border-slate-700 light:border-slate-250 rounded-xl md:rounded-2xl leading-5 bg-slate-800/50 light:bg-slate-100/70 text-slate-200 light:text-slate-800 placeholder-slate-400 light:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm transition-all duration-300 focus:bg-slate-800 light:focus:bg-white"
                placeholder={t('nav_search_placeholder')}
              />
            </form>

            {/* Desktop Autocomplete Suggestions */}
            {showSuggestions && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl overflow-hidden shadow-2xl light:shadow-slate-200/50 backdrop-blur-xl z-[60] animate-fade-in">
                {suggestions.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-500 light:text-slate-400 uppercase tracking-wider">
                      {t('pay_items_purchased')}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto" role="listbox" id={listboxId} aria-label={t('search')}>
                      {suggestions.map((product, index) => (
                        <button type="button" role="option" id={optionId(product.id)} aria-selected={index === activeSuggestion} tabIndex={-1} onMouseEnter={() => setActiveSuggestion(index)}
                          key={product.id}
                          onClick={() => {
                            onOpenProductModal(product);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 light:hover:bg-slate-50 cursor-pointer transition-colors group w-full text-left"
                        >
                          <span className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700/50 light:border-slate-200">
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-slate-200 light:text-slate-800 truncate group-hover:text-indigo-400 light:group-hover:text-indigo-650 transition-colors">
                              {product.title}
                            </span>
                            <span className="block text-xs text-slate-455 light:text-slate-500 truncate mt-0.5">
                              {product.category}
                            </span>
                          </span>
                          <span className="text-sm font-bold text-white light:text-slate-900 flex-shrink-0">
                            {formatPrice(product.price, currency, exchangeRate)}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-800/80 light:border-slate-100 mt-1 px-3 py-2">
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full text-center text-xs font-semibold text-indigo-400 light:text-indigo-650 hover:text-indigo-300 light:hover:text-indigo-750 py-2 rounded-xl hover:bg-indigo-500/10 light:hover:bg-indigo-50/50 transition-colors cursor-pointer"
                      >
                        {t('main_all_products_btn')} ({totalMatches})
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500 light:text-slate-400">
                    {t('seller_no_products')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => {
                const element = document.getElementById('products-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-slate-300 hover:text-white light:text-slate-700 light:hover:text-slate-900 p-2 rounded-lg transition-colors hidden md:block cursor-pointer text-xs font-semibold"
            >
              {t('nav_categories')}
            </button>

            {/* Currency Switcher */}
            <div className="hidden md:flex bg-slate-800/80 light:bg-slate-100 p-0.5 rounded-xl border border-slate-700/50 light:border-slate-250 items-center">
              <button 
                onClick={() => {
                  setCurrency('USD');
                  toast(t('currency_switched_usd'), { icon: '💵' });
                }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  currency === 'USD' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                }`}
              >
                USD
              </button>
              <button 
                onClick={() => {
                  setCurrency('UZS');
                  toast(`${t('currency_switched_uzs')} (1$ = ${formatExchangeRate(exchangeRate)} so'm)`, { icon: '🇺🇿', duration: 3000 });
                }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  currency === 'UZS' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                }`}
              >
                UZS
              </button>
            </div>

            {/* Language Switcher */}
            <div className="relative hidden md:block" ref={langDropdownRef}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={isLangOpen}
                aria-label={t('nav_select_language')}
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700/50 light:border-slate-250 rounded-xl text-slate-300 hover:text-white light:text-slate-700 light:hover:text-slate-900 transition-colors duration-200 text-[10px] font-bold cursor-pointer shadow-sm"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span className="uppercase">{language}</span>
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2.5 w-36 bg-slate-900/95 light:bg-white/95 backdrop-blur-xl border border-slate-800 light:border-slate-200/80 rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in">
                  <div className="px-2.5 py-1 text-[8px] font-bold text-slate-500 light:text-slate-450 uppercase tracking-wider select-none border-b border-slate-800/50 light:border-slate-100 mb-1">
                    {t('nav_select_language')}
                  </div>
                  {LANGUAGE_OPTIONS.map((option) => {
                    const selected = option.code === language;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setLanguage(option.code);
                          setIsLangOpen(false);
                          toast(t(option.toastKey), { icon: option.flag });
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          selected
                            ? 'text-[#00F2C2] bg-[#00F2C2]/10 light:text-indigo-650 light:bg-indigo-50/80'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm" aria-hidden="true">{option.flag}</span>
                          <span lang={option.code}>{option.nativeName}</span>
                        </span>
                        {selected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2] light:bg-indigo-600 animate-pulse" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 bg-slate-800/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700/50 light:border-slate-250 rounded-xl text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-900 transition-all cursor-pointer active:scale-95 shadow-md items-center justify-center"
              aria-label={t('a11y_toggle_theme')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
            
            {/* Cart Icon */}
            <button 
              onClick={() => setIsCartOpen(true)}
              aria-label={t('nav_cart')}
              className="hidden md:block text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-900 p-2 rounded-lg transition-colors relative cursor-pointer"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 light:border-white shadow">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Auth section */}
            {currentUser ? (
              <div className="relative hidden md:block" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 light:bg-white light:hover:bg-slate-50 text-white light:text-slate-800 px-4 py-2 rounded-xl transition-all duration-300 border border-slate-700/50 light:border-slate-200 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate text-sm font-semibold text-slate-200 light:text-slate-700">
                    {currentUser.name}
                  </span>
                </button>
                
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl light:shadow-slate-200/80 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-800 light:border-slate-100">
                      <p className="text-[10px] text-slate-500 light:text-slate-400 font-bold uppercase tracking-wider">{t('auth_welcome_back').split(' ')[0]}</p>
                      <p className="text-sm font-bold text-white light:text-slate-900 truncate mt-0.5">{currentUser.name}</p>
                      <p className="text-xs text-slate-455 light:text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenProfileSettings();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-350 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {t('nav_profile_settings')}
                    </button>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenMyPurchases();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-350 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {t('nav_my_purchases')}
                    </button>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenSeller();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-350 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {t('nav_seller_panel')}
                    </button>
                    <div className="border-t border-slate-800/80 light:border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav_logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20 font-medium cursor-pointer"
              >
                <User className="w-5 h-5" />
                {t('nav_login')}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in cursor-default"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        // Yopiq panel ekrandan tashqariga surilgan, lekin DOM da qoladi. `inert`
        // busiz klaviatura foydalanuvchisi ko'rinmaydigan tugmalarga Tab bilan kirardi.
        inert={!isMobileMenuOpen}
        role="dialog"
        aria-modal={isMobileMenuOpen}
        aria-label={t('a11y_menu')}
        className={`fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col bg-slate-900 light:bg-white border-t border-slate-800 light:border-slate-200 rounded-t-3xl shadow-2xl transition-all duration-300 transform ${
          isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          maxHeight: '80vh', 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' 
        }}
      >
        {/* Drag Handle */}
        <button type="button" aria-label={t('close')} className="w-full flex justify-center py-3.5 border-b border-slate-800/60 light:border-slate-100/80 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="block w-12 h-1.5 bg-slate-700 light:bg-slate-300 rounded-full" aria-hidden="true" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                const element = document.getElementById('products-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }} 
              className="text-left text-slate-350 hover:text-white light:text-slate-655 light:hover:text-slate-900 px-2 py-2 rounded-lg text-sm font-semibold"
            >
              {t('nav_categories')}
            </button>

            {/* Mobile Currency Switcher */}
            <div className="flex items-center justify-between px-2 py-2 border-t border-slate-800/60 light:border-slate-100 mt-1">
              <span className="text-sm text-slate-400 font-medium light:text-slate-600">{t('nav_currency')}</span>
              <div className="flex bg-slate-800/85 light:bg-slate-100 p-0.5 rounded-lg border border-slate-700/55 light:border-slate-200">
                <button 
                  onClick={() => {
                    setCurrency('USD');
                    toast(t('currency_switched_usd'), { icon: '💵' });
                  }}
                  className={`px-3 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    currency === 'USD' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-slate-205 light:text-slate-500 light:hover:text-slate-800'
                  }`}
                >
                  USD
                </button>
                <button 
                  onClick={() => {
                    setCurrency('UZS');
                    toast(`${t('currency_switched_uzs')} (1$ = ${formatExchangeRate(exchangeRate)} so'm)`, { icon: '🇺🇿', duration: 3000 });
                  }}
                  className={`px-3 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    currency === 'UZS' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-slate-205 light:text-slate-500 light:hover:text-slate-800'
                  }`}
                >
                  UZS
                </button>
              </div>
            </div>

            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between px-2 py-2 border-t border-slate-800/60 light:border-slate-100">
              <span className="text-sm text-slate-400 font-medium light:text-slate-600">{t('nav_language')}</span>
              <div className="flex bg-slate-800/85 light:bg-slate-100 p-0.5 rounded-lg border border-slate-700/55 light:border-slate-200">
                {LANGUAGE_OPTIONS.map((option) => {
                  const selected = option.code === language;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      aria-pressed={selected}
                      aria-label={option.nativeName}
                      onClick={() => {
                        setLanguage(option.code);
                        toast(t(option.toastKey), { icon: option.flag });
                      }}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        selected
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-205 light:text-slate-500 light:hover:text-slate-800'
                      }`}
                    >
                      {option.code.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Theme Switcher */}
            <div className="flex items-center justify-between px-2 py-2 border-t border-slate-800/60 light:border-slate-100">
              <span className="text-sm text-slate-400 font-medium light:text-slate-600">{t('nav_mode')}</span>
              <div className="flex bg-slate-800/85 p-0.5 rounded-lg border border-slate-700/55 light:bg-slate-100 light:border-slate-200">
                <button 
                  onClick={() => { if (theme !== 'light') toggleTheme(); }}
                  className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    theme === 'light' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-202 light:text-slate-500 light:hover:text-slate-800'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  {t('nav_mode_light')}
                </button>
                <button 
                  onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                  className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-202 light:text-slate-500 light:hover:text-slate-800'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  {t('nav_mode_dark')}
                </button>
              </div>
            </div>
            
            {currentUser ? (
              <div className="border-t border-slate-800 light:border-slate-100 pt-2 mt-1 space-y-2">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-slate-500 light:text-slate-400 font-bold uppercase tracking-wider">{t('auth_welcome_back').split(' ')[0]}</p>
                  <p className="text-sm font-bold text-white light:text-slate-900 truncate mt-0.5">{currentUser.name}</p>
                  <p className="text-xs text-slate-455 light:text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenProfileSettings();
                  }}
                  className="w-full text-left text-slate-350 hover:text-white light:text-slate-650 light:hover:text-slate-900 px-2 py-2 rounded-lg text-sm cursor-pointer"
                >
                  {t('nav_profile_settings')}
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenMyPurchases();
                  }}
                  className="w-full text-left text-slate-350 hover:text-white light:text-slate-655 light:hover:text-slate-900 px-2 py-2 rounded-lg text-sm cursor-pointer"
                >
                  {t('nav_my_purchases')}
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSeller();
                  }}
                  className="w-full text-left text-slate-350 hover:text-white light:text-slate-655 light:hover:text-slate-900 px-2 py-2 rounded-lg text-sm cursor-pointer"
                >
                  {t('nav_seller_panel')}
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left text-red-400 hover:text-red-300 light:text-red-655 light:hover:text-red-750 px-2 py-2 rounded-lg text-sm flex items-center gap-2 font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav_logout')}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }} 
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium w-full mt-2 cursor-pointer"
              >
                <User className="w-5 h-5" />
                {t('nav_login')}
              </button>
            )}
          </div>
        </div>
      </div>

    {/* Mobile Bottom Navigation Bar */}
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 light:bg-white/95 backdrop-blur-xl border-t border-slate-800/80 light:border-slate-200/80 px-4 pt-2 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] transition-all duration-300 select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {/* Home Button */}
        <button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsMobileMenuOpen(false);
          }}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 transition-all duration-200 flex-1 active:scale-95 cursor-pointer"
        >
          <Home className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
          <span className="text-[10px] font-semibold">{t('nav_home') || 'Asosiy'}</span>
        </button>

        {/* Categories Button */}
        <button 
          onClick={() => {
            setIsMobileMenuOpen(false);
            const element = document.getElementById('products-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 transition-all duration-200 flex-1 active:scale-95 cursor-pointer"
        >
          <Compass className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
          <span className="text-[10px] font-semibold">{t('nav_categories')}</span>
        </button>

        {/* Cart Button */}
        <button 
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsCartOpen(true);
          }}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 transition-all duration-200 flex-1 relative active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-950 light:border-white shadow animate-pulse">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">{t('nav_cart')}</span>
        </button>

        {/* Profile Button */}
        <button 
          onClick={() => {
            setIsMobileMenuOpen(false);
            if (currentUser) {
              onOpenProfileSettings();
            } else {
              onOpenAuth();
            }
          }}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 transition-all duration-200 flex-1 active:scale-95 cursor-pointer"
        >
          <User className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
          <span className="text-[10px] font-semibold truncate max-w-[60px]">
            {currentUser ? currentUser.name.split(' ')[0] : t('nav_profile') || 'Profil'}
          </span>
        </button>

        {/* Menu Toggle Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center gap-1 transition-all duration-200 flex-1 active:scale-95 cursor-pointer ${
            isMobileMenuOpen 
              ? 'text-indigo-500 light:text-indigo-600' 
              : 'text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900'
          }`}
        >
          <Menu className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
          <span className="text-[10px] font-semibold">{t('nav_menu') || 'Menyu'}</span>
        </button>
      </div>
    </div>
  </>
);
};

export default Navbar;
