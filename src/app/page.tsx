"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
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
import { Product, products } from '@/data/products';
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

  // Currency state
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(12800); // Default fallback rate

  // Loading state (for category changes)
  const [isLoading, setIsLoading] = useState(false);

  // Back to Top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Dynamic products list state
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Seller dashboard state
  const [isSellerOpen, setIsSellerOpen] = useState(false);

  // User Profile settings & Purchases state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'purchases' | 'settings'>('purchases');
  const [purchasedProducts, setPurchasedProducts] = useState<Product[]>([]);

  // Safely initialize state on client-side mount & fetch exchange rate
  useEffect(() => {
    // Load cart
    const savedCart = localStorage.getItem('zetra-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Savatchani yuklashda xatolik:", e);
      }
    }

    // Load user
    const savedUser = localStorage.getItem('zetra-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("User yuklashda xatolik:", e);
      }
    }

    // Load dynamic products list
    const savedProducts = localStorage.getItem('zetra-products');
    if (savedProducts) {
      try {
        setAllProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Mahsulotlarni yuklashda xatolik:", e);
        setAllProducts(products);
      }
    } else {
      setAllProducts(products);
    }

    // Load purchased products
    const savedPurchases = localStorage.getItem('zetra-purchases');
    if (savedPurchases) {
      try {
        setPurchasedProducts(JSON.parse(savedPurchases));
      } catch (e) {
        console.error("Purchases yuklashda xatolik:", e);
      }
    }

    // Fetch live currency exchange rate
    const fetchExchangeRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('Api call failed');
        const data = await res.json();
        if (data && data.rates && data.rates.UZS) {
          setExchangeRate(data.rates.UZS);
          console.log(`ZETRA: Real vaqtdagi USD/UZS kursi muvaffaqiyatli yuklandi: 1 USD = ${data.rates.UZS} UZS`);
        }
      } catch (err) {
        console.warn("ZETRA: Jonli valyuta kursini olishda xatolik (fallback ishlatiladi):", err);
      }
    };

    fetchExchangeRate();
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

  // Save products changes to localStorage once client-side is initialized
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('zetra-products', JSON.stringify(allProducts));
    }
  }, [allProducts, isInitialized]);

  // Save purchases changes to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('zetra-purchases', JSON.stringify(purchasedProducts));
    }
  }, [purchasedProducts, isInitialized]);

  // Scroll event listener for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    setIsSellerOpen(false); // Close dashboard on logout
    setIsProfileOpen(false); // Close profile on logout
    setPurchasedProducts([]); // Clear purchases on logout
    localStorage.removeItem('zetra-purchases');
    toast.success("Tizimdan muvaffaqiyatli chiqdingiz!", { icon: '👋' });
  };

  // Simulating loading skeletons when category is changed
  const handleSelectCategory = (category: string | null) => {
    setIsLoading(true);
    setSelectedCategory(category);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBecomeSeller = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      toast.error("Sotuvchi bo'limiga kirish uchun avval tizimga kiring!");
    } else {
      setIsSellerOpen(true);
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setAllProducts((prev) => [newProduct, ...prev]);
  };

  const handleDeleteProduct = (id: number) => {
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOpenProfileSettings = () => {
    setProfileActiveTab('settings');
    setIsProfileOpen(true);
  };

  const handleOpenMyPurchases = () => {
    setProfileActiveTab('purchases');
    setIsProfileOpen(true);
  };

  const handleUpdateProfile = (name: string, email: string) => {
    setCurrentUser((prev) => prev ? { ...prev, name, email } : { name, email });
  };

  const handleCheckout = () => {
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

    // Convert CartItems to Products (strip quantity)
    const newPurchases = cart.map(item => {
      const { quantity, ...product } = item;
      return product as Product;
    });

    setPurchasedProducts((prev) => [...newPurchases, ...prev]);
    setCart([]); // Clear cart
    setIsCartOpen(false); // Close cart drawer
    toast.success("To'lov muvaffaqiyatli o'tdi! Rahmat!", { icon: '🎉', duration: 4000 });

    // Open My Purchases modal after a brief delay
    setTimeout(() => {
      handleOpenMyPurchases();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 selection:bg-indigo-500/30 relative">
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
        currency={currency}
        exchangeRate={exchangeRate}
      />

      <SellerDashboard 
        isOpen={isSellerOpen}
        onClose={() => setIsSellerOpen(false)}
        products={allProducts}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
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
        onUpdateProfile={handleUpdateProfile}
        purchases={purchasedProducts}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* Floating Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl transition-all duration-300 border border-indigo-500/20 active:scale-95 cursor-pointer flex items-center justify-center ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Yuqoriga qaytish"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
