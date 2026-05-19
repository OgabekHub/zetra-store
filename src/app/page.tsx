"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Header from '@/components/Header/Header';
import Carousel from '@/components/Carousel/Carousel';
import MainContent from '@/components/MainContent/MainContent';
import Footer from '@/components/Footer/Footer';
import CartDrawer from '@/components/Navbar/CartDrawer';
import { Product } from '@/data/products';

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Safely initialize cart state on client-side mount
  useEffect(() => {
    const savedCart = localStorage.getItem('zetra-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Savatchani yuklashda xatolik:", e);
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
      />
      <Footer />
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
}
