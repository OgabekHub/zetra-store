"use client";

import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, User, X } from 'lucide-react';
import Image from 'next/image';
import zetraLogo from '../../assets/images/zetra-logo2-backup.png';

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  category: string;
  image: string;
}

interface NavbarProps {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  cartItems = [], 
  isCartOpen, 
  setIsCartOpen, 
  onUpdateQuantity, 
  onRemoveItem, 
  searchQuery, 
  setSearchQuery 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer">
            <Image 
              src={zetraLogo} 
              alt="Zetra Logo" 
              className="h-64 w-64 object-contain -my-24"
              priority
            />
          </div>

          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={(e) => e.preventDefault()} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-2xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-300 focus:bg-slate-800"
                placeholder="Shablon, kod, e-kitob yoki litsenziya qidirish..."
              />
            </form>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => alert("Kategoriyalar ochilmoqda...")}
              className="text-slate-300 hover:text-white p-2 rounded-lg transition-colors hidden md:block"
            >
              Kategoriyalar
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="text-slate-300 hover:text-white p-2 rounded-lg transition-colors relative"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={() => alert("Kirish oynasi...")}
              className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20 font-medium"
            >
              <User className="w-5 h-5" />
              Kirish
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-4">
          <form onSubmit={(e) => e.preventDefault()} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-2xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Qidirish..."
            />
          </form>
          <div className="flex flex-col gap-2">
            <button onClick={() => alert("Kategoriyalar")} className="text-left text-slate-300 hover:text-white px-2 py-2 rounded-lg">
              Kategoriyalar
            </button>
            <button onClick={() => alert("Kirish")} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl">
              <User className="w-5 h-5" />
              Kirish
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
