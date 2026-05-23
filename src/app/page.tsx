"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Header from '@/components/Header/Header';
import Carousel from '@/components/Carousel/Carousel';
import MainContent from '@/components/MainContent/MainContent';
import Footer from '@/components/Footer/Footer';
import CartDrawer from '@/components/Navbar/CartDrawer';
import AuthModal from '@/components/Navbar/AuthModal';
import ProductModal from '@/components/MainContent/ProductModal';
import { Product } from '@/data/products';
import { CartItem } from '@/types';
import toast from 'react-hot-toast';

interface UserProfile {
  name: string;
  email: string;
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Centralized Product Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Safely initialize state on client-side mount
  useEffect(() => {
    const savedCart = localStorage.getItem('zetra-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Savatchani yuklashda xatolik:", e);
      }
    }

    const savedUser = localStorage.getItem('zetra-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("User yuklashda xatolik:", e);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Save cart changes to localStorage once client-side is initialized
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('zetra-cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // Save user changes to localStorage once client-side is initialized
  useEffect(() => {
    if (isInitialized) {
      if (currentUser) {
        localStorage.setItem('zetra-user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('zetra-user');
      }
    }
  }, [currentUser, isInitialized]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    // Open cart drawer immediately for instant feedback
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleOpenProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast.success("Tizimdan muvaffaqiyatli chiqdingiz!", { icon: '👋' });
  };

  return (
    <div className="min-h-screen bg-slate-900 selection:bg-indigo-500/30">
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
      />
      <Header />
      <Carousel 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <MainContent 
        onAddToCart={addToCart} 
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onClearFilters={clearFilters}
        onOpenProductModal={handleOpenProductModal}
      />
      <Footer />
      
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(name, email) => setCurrentUser({ name, email })}
      />

      <ProductModal 
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={addToCart}
      />
    </div>
  );
}

