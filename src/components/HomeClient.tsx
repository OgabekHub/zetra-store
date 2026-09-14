"use client";

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

import Navbar from '@/components/Navbar/Navbar';
import Header from '@/components/Header/Header';
import Carousel from '@/components/Carousel/Carousel';
import MainContent from '@/components/MainContent/MainContent';
import Footer from '@/components/Footer/Footer';
import CartDrawer from '@/components/Navbar/CartDrawer';

import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/context/LanguageContext';
import { uiStore, useUiState } from '@/store/uiStore';
import { migrateLegacyCatalog } from '@/store/catalogStore';
import type { Product } from '@/types';

// Bu beshta modal avval shartsiz o'rnatilar edi va faqat ichida
// `if (!isOpen) return null` qilardi — ya'ni hech qachon unmount bo'lmasdi.
// Shuning uchun ular bosh sahifaning boshlang'ich paketiga to'liq kirardi
// (3 700 dan ortiq qator) va yopilgandan keyin ham holatini saqlab qolardi.
const AuthModal = dynamic(() => import('@/components/Navbar/AuthModal'));
const ProductModal = dynamic(() => import('@/components/MainContent/ProductModal'));
const SellerDashboard = dynamic(() => import('@/components/Navbar/SellerDashboard'));
const UserProfileModal = dynamic(() => import('@/components/Navbar/UserProfileModal'));
const PaymentModal = dynamic(() => import('@/components/Navbar/PaymentModal'));

export default function HomeClient() {
  const { t } = useLanguage();
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { currentUser, isAuthOpen, setIsAuthOpen, purchases, login, logout, updateProfile, addPurchases } =
    useAuth();
  const { allProducts, addProduct, deleteProduct } = useProducts();
  const { currency, setCurrency, exchangeRate } = useCurrency();
  const { isSellerOpen, isProfileOpen, isPaymentOpen, profileTab } = useUiState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Eski `zetra-products` snapshot'ini bir marta ustqurmaga o'tkazadi.
  useEffect(() => {
    migrateLegacyCatalog();
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
  }, []);

  const handleOpenProductModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  }, []);

  const handleSelectCategory = useCallback((category: string | null) => {
    setIsLoading(true);
    setSelectedCategory(category);
    setTimeout(() => setIsLoading(false), 600);
  }, []);

  const handleBecomeSeller = useCallback(() => {
    if (!currentUser) {
      setIsAuthOpen(true);
      toast.error(t('seller_login_required'));
      return;
    }
    uiStore.set({ isSellerOpen: true });
  }, [currentUser, setIsAuthOpen, t]);

  const handleOpenProfileSettings = useCallback(() => {
    uiStore.set({ profileTab: 'settings', isProfileOpen: true });
  }, []);

  const handleOpenMyPurchases = useCallback(() => {
    uiStore.set({ profileTab: 'purchases', isProfileOpen: true });
  }, []);

  const handleCheckout = useCallback(() => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      toast.error(t('auth_login_required'));
      return;
    }
    if (cart.length === 0) {
      toast.error(t('cart_empty_error'));
      return;
    }
    uiStore.set({ isCartOpen: false, isPaymentOpen: true });
  }, [currentUser, cart, setIsCartOpen, setIsAuthOpen, t]);

  const handleStartShopping = useCallback(() => {
    setIsCartOpen(false);
    setTimeout(() => {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [setIsCartOpen]);

  const handlePaymentSuccess = useCallback(() => {
    // Savat qatorlari miqdori bilan birga uzatiladi. Avval `quantity` shu
    // yerda tashlab yuborilardi, shuning uchun 3 ta litsenziya sotib olgan
    // foydalanuvchi 3 tasiga pul to'lab, bitta yozuv olardi.
    addPurchases(cart);
    clearCart();
    uiStore.set({ isPaymentOpen: false });
    setTimeout(() => handleOpenMyPurchases(), 600);
  }, [cart, addPurchases, clearCart, handleOpenMyPurchases]);

  const handleLogout = useCallback(() => {
    logout();
    uiStore.set({ isSellerOpen: false, isProfileOpen: false });
  }, [logout]);

  return (
    <div className="min-h-screen bg-brand-dark light:bg-slate-50 selection:bg-brand-primary/30 relative pb-20 md:pb-0">
      <Navbar
        cartItems={cart}
        setIsCartOpen={setIsCartOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProductModal={handleOpenProductModal}
        currency={currency}
        setCurrency={setCurrency}
        exchangeRate={exchangeRate}
        products={allProducts}
        onOpenSeller={handleBecomeSeller}
        onOpenProfileSettings={handleOpenProfileSettings}
        onOpenMyPurchases={handleOpenMyPurchases}
      />
      <Header onBecomeSeller={handleBecomeSeller} />
      <Carousel selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} />
      <MainContent
        onAddToCart={addToCart}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onClearFilters={clearFilters}
        onOpenProductModal={handleOpenProductModal}
        currency={currency}
        exchangeRate={exchangeRate}
        isLoading={isLoading}
        products={allProducts}
      />
      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        currency={currency}
        exchangeRate={exchangeRate}
        onCheckout={handleCheckout}
        onStartShopping={handleStartShopping}
      />

      {/* Shartli o'rnatish: modal yopilganda haqiqatan unmount bo'ladi, shuning
          uchun keyingi ochilishda holati toza boshlanadi. */}
      {isAuthOpen && (
        <AuthModal isOpen onClose={() => setIsAuthOpen(false)} onLoginSuccess={login} />
      )}

      {isProductModalOpen && selectedProduct && (
        <ProductModal
          // `key` mahsulot o'zgarganda komponentni qaytadan yaratadi, shuning
          // uchun ko'rish rejimini effektda tiklash kerak emas.
          key={selectedProduct.id}
          product={selectedProduct}
          isOpen
          onClose={() => setIsProductModalOpen(false)}
          onAddToCart={addToCart}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}

      {isSellerOpen && (
        <SellerDashboard
          isOpen
          onClose={() => uiStore.set({ isSellerOpen: false })}
          products={allProducts}
          onAddProduct={addProduct}
          onDeleteProduct={deleteProduct}
          currency={currency}
          exchangeRate={exchangeRate}
          currentUser={currentUser}
        />
      )}

      {isProfileOpen && (
        <UserProfileModal
          isOpen
          onClose={() => uiStore.set({ isProfileOpen: false })}
          activeTab={profileTab}
          setActiveTab={(tab) => uiStore.set({ profileTab: tab })}
          currentUser={currentUser}
          onUpdateProfile={updateProfile}
          purchases={purchases}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal
          isOpen
          onClose={() => uiStore.set({ isPaymentOpen: false })}
          cartItems={cart}
          currency={currency}
          exchangeRate={exchangeRate}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
