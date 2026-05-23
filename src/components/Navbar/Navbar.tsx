"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Menu, User, X, LogOut } from 'lucide-react';
import Image from 'next/image';
import zetraLogo from '../../assets/images/zetra-logo2-backup.png';
import { CartItem } from '@/types';
import { Product, products } from '@/data/products';
import toast from 'react-hot-toast';

interface UserProfile {
  name: string;
  email: string;
}

interface NavbarProps {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenProductModal: (product: Product) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  cartItems = [], 
  isCartOpen, 
  setIsCartOpen, 
  onUpdateQuantity, 
  onRemoveItem, 
  searchQuery, 
  setSearchQuery,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenProductModal
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Desktop search click outside
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      
      // Mobile search click outside
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(target)) {
        setShowMobileSuggestions(false);
      }

      // User dropdown click outside
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setShowMobileSuggestions(false);
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
    setShowMobileSuggestions(false);
    setIsMobileMenuOpen(false);
    
    const element = document.getElementById('products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter suggestions
  const getSuggestions = (query: string) => {
    if (!query.trim()) return [];
    return products.filter((product) =>
      product.title.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const suggestions = getSuggestions(searchQuery);
  const totalMatches = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setSearchQuery('');
            }}
            className="flex-shrink-0 flex items-center cursor-pointer"
          >
            <Image 
              src={zetraLogo} 
              alt="Zetra Logo" 
              className="h-48 w-48 object-contain -my-18"
              priority
            />
          </div>

          {/* Search Bar - Hidden on Mobile */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-2xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-300 focus:bg-slate-800"
                placeholder="Shablon, kod, e-kitob yoki litsenziya qidirish..."
              />
            </form>

            {/* Desktop Autocomplete Suggestions */}
            {showSuggestions && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl z-[60] animate-fade-in">
                {suggestions.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Mahsulotlar
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {suggestions.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            onOpenProductModal(product);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 cursor-pointer transition-colors group"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700/50">
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                              {product.title}
                            </h4>
                            <p className="text-xs text-slate-450 truncate mt-0.5">
                              {product.category}
                            </p>
                          </div>
                          <div className="text-sm font-bold text-white flex-shrink-0">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-800/80 mt-1 px-3 py-2">
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-2 rounded-xl hover:bg-indigo-500/10 transition-colors cursor-pointer"
                      >
                        Barcha natijalarni ko'rish ({totalMatches} ta)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Mahsulot topilmadi
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const element = document.getElementById('products-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-slate-300 hover:text-white p-2 rounded-lg transition-colors hidden md:block cursor-pointer"
            >
              Kategoriyalar
            </button>
            
            {/* Cart Icon */}
            <button 
              onClick={() => setIsCartOpen(true)}
              aria-label="Savatcha"
              className="text-slate-300 hover:text-white p-2 rounded-lg transition-colors relative cursor-pointer"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Auth section */}
            {currentUser ? (
              <div className="relative hidden md:block" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-all duration-300 border border-slate-700/50 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate text-sm font-semibold text-slate-200">
                    {currentUser.name}
                  </span>
                </button>
                
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hisobingiz</p>
                      <p className="text-sm font-bold text-white truncate mt-0.5">{currentUser.name}</p>
                      <p className="text-xs text-slate-450 truncate mt-0.5">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        toast('Profil sozlamalari bo\'limi tez orada!', { icon: '⚙️' });
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-350 hover:text-white hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      Profil sozlamalari
                    </button>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        toast('Mening xaridlarim sahifasi tez orada!', { icon: '📦' });
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-350 hover:text-white hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      Mening xaridlarim
                    </button>
                    <div className="border-t border-slate-800/80 my-1"></div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Chiqish
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
                Kirish
              </button>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menyu"
              className="md:hidden text-slate-300 hover:text-white p-2 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-5 space-y-4">
          
          {/* Mobile Search */}
          <div ref={mobileSearchRef} className="relative w-full">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowMobileSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowMobileSuggestions(true);
                }}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-2xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Qidirish..."
              />
            </form>

            {/* Mobile Autocomplete Suggestions */}
            {showMobileSuggestions && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-[60]">
                {suggestions.length > 0 ? (
                  <div className="py-1">
                    <div className="px-4 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Mahsulotlar
                    </div>
                    <div className="max-h-[240px] overflow-y-auto">
                      {suggestions.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            onOpenProductModal(product);
                            setShowMobileSuggestions(false);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-800/60 cursor-pointer"
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-200 truncate">
                              {product.title}
                            </h4>
                            <p className="text-[10px] text-slate-450 truncate">
                              {product.category}
                            </p>
                          </div>
                          <div className="text-xs font-bold text-white">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-800 mt-1 px-3 py-1.5">
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full text-center text-xs font-semibold text-indigo-400 py-1"
                      >
                        Barcha natijalarni ko'rish ({totalMatches} ta)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Mahsulot topilmadi
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                const element = document.getElementById('products-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }} 
              className="text-left text-slate-300 hover:text-white px-2 py-2 rounded-lg"
            >
              Kategoriyalar
            </button>
            
            {currentUser ? (
              <div className="border-t border-slate-800 pt-2 mt-1 space-y-2">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hisob</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">{currentUser.name}</p>
                  <p className="text-xs text-slate-450 truncate mt-0.5">{currentUser.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    toast('Profil sozlamalari tez orada!', { icon: '⚙️' });
                  }}
                  className="w-full text-left text-slate-350 hover:text-white px-2 py-2 rounded-lg text-sm"
                >
                  Profil sozlamalari
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    toast('Mening xaridlarim tez orada!', { icon: '📦' });
                  }}
                  className="w-full text-left text-slate-350 hover:text-white px-2 py-2 rounded-lg text-sm"
                >
                  Mening xaridlarim
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left text-red-400 hover:text-red-300 px-2 py-2 rounded-lg text-sm flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Chiqish
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }} 
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium w-full mt-2"
              >
                <User className="w-5 h-5" />
                Kirish
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
