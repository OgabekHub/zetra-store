"use client";

import React, { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Header from '@/components/Header/Header';
import Carousel from '@/components/Carousel/Carousel';
import MainContent from '@/components/MainContent/MainContent';
import Footer from '@/components/Footer/Footer';
import CartDrawer from '@/components/Navbar/CartDrawer';
import AuthModal from '@/components/Navbar/AuthModal';
import ProductModal from '@/components/MainContent/ProductModal';
import SellerDashboard from '@/components/Navbar/SellerDashboard';
import UserProfileModal from '@/components/Navbar/UserProfileModal';
import PaymentModal from '@/components/Navbar/PaymentModal';
import { Product } from '@/data/products';
import { CartItem } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useCurrency } from '@/hooks/useCurrency';
import toast from 'react-hot-toast';

export default function Home() {
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, totalItems } = useCart();
  const { currentUser, isAuthOpen, setIsAuthOpen, purchasedProducts, login, logout, updateProfile, addPurchases } = useAuth();
  const { allProducts, addProduct, deleteProduct } = useProducts();
  const { currency, setCurrency, exchangeRate } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [isSellerOpen, setIsSellerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'purchases' | 'settings' | 'security'>('purchases');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

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
      toast.error("Sotuvchi bo'limiga kirish uchun avval tizimga kiring!");
    } else {
      setIsSellerOpen(true);
    }
  }, [currentUser, setIsAuthOpen]);

  const handleOpenProfileSettings = useCallback(() => {
    setProfileActiveTab('settings');
    setIsProfileOpen(true);
  }, []);

  const handleOpenMyPurchases = useCallback(() => {
    setProfileActiveTab('purchases');
    setIsProfileOpen(true);
  }, []);

  const handleCheckout = useCallback(() => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      toast.error("Xarid qilish uchun avval tizimga kiring!");
      return;
    }
    if (cart.length === 0) {
      toast.error("Savatchangiz bo'sh!");
      return;
    }
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  }, [currentUser, cart, setIsCartOpen, setIsAuthOpen]);

  const handleStartShopping = useCallback(() => {
    setIsCartOpen(false);
    setTimeout(() => {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [setIsCartOpen]);

  const handlePaymentSuccess = useCallback(() => {
    const newPurchases = cart.map(({ quantity: _q, ...product }) => product as Product);
    addPurchases(newPurchases);
    clearCart();
    setIsPaymentOpen(false);
    setTimeout(() => handleOpenMyPurchases(), 600);
  }, [cart, addPurchases, clearCart, handleOpenMyPurchases]);

  const handleLogout = useCallback(() => {
    logout();
    setIsSellerOpen(false);
    setIsProfileOpen(false);
  }, [logout]);

  return (
    <div className="min-h-screen bg-brand-dark selection:bg-brand-primary/30 relative pb-20 md:pb-0">
      <Navbar
        cartItems={cart}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
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
      <Carousel
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={login}
      />

      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={addToCart}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      <SellerDashboard
        isOpen={isSellerOpen}
        onClose={() => setIsSellerOpen(false)}
        products={allProducts}
        onAddProduct={addProduct}
        onDeleteProduct={deleteProduct}
        currency={currency}
        exchangeRate={exchangeRate}
        currentUser={currentUser}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        activeTab={profileActiveTab}
        setActiveTab={setProfileActiveTab}
        currentUser={currentUser}
        onUpdateProfile={updateProfile}
        purchases={purchasedProducts}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        cartItems={cart}
        currency={currency}
        exchangeRate={exchangeRate}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
