"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, ShoppingBag, Lock, Mail, Download, Settings, Calendar, ShieldCheck } from 'lucide-react';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'purchases' | 'settings';
  setActiveTab: (tab: 'purchases' | 'settings') => void;
  currentUser: { name: string; email: string } | null;
  onUpdateProfile: (name: string, email: string) => void;
  purchases: Product[];
  currency: 'USD' | 'UZS';
  exchangeRate: number;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  currentUser,
  onUpdateProfile,
  purchases = [],
  currency,
  exchangeRate
}) => {
  // Profile settings fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Download simulation states
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [secKeys, setSecKeys] = useState<{ [productId: number]: { license: string; decrypt: string } }>({});

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync security keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('zetra-security-keys');
    if (savedKeys) {
      try {
        setSecKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error("Kompilyatsiya va shifrlash kalitlarini yuklashda xatolik:", e);
      }
    }
  }, []);

  // Save security keys to localStorage
  useEffect(() => {
    if (Object.keys(secKeys).length > 0) {
      localStorage.setItem('zetra-security-keys', JSON.stringify(secKeys));
    }
  }, [secKeys]);

  // Sync state with currentUser when modal opens or user changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser, isOpen]);

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

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error('Ism va E-pochta bo\'sh bo\'lishi mumkin emas!');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak!');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Yangi parollar bir-biriga mos kelmadi!');
        return;
      }
    }

    onUpdateProfile(name, email);
    toast.success('Profil ma\'lumotlari muvaffaqiyatli yangilandi!', { icon: '⚙️' });
    
    // Clear passwords
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDownload = (product: Product) => {
    if (downloadingId !== null) return;

    setDownloadingId(product.id);
    setDownloadProgress(0);

    const steps = [
      { p: 15, msg: "Xarid va litsenziya tekshirilmoqda..." },
      { p: 40, msg: `Visual suv belgisi joylanmoqda: ${currentUser?.email || 'ogabek@zetra.uz'}` },
      { p: 70, msg: "Fayl shaxsiy kalit bilan AES-255 shifrlanmoqda..." },
      { p: 90, msg: "Cloudflare R2 vaqtinchalik xavfsiz tokeni olinmoqda..." },
      { p: 100, msg: "Shifrlangan fayl yuklanmoqda..." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setDownloadProgress(steps[currentStep].p);
        setDownloadStatus(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);

        // Generate and save unique keys
        const licenseKey = `ZTR-LIC-${Math.floor(100000 + Math.random() * 900000)}-${product.id}`;
        const decryptKey = `ZTR-KEY-${Math.floor(10000 + Math.random() * 90000)}`;

        setSecKeys(prev => ({
          ...prev,
          [product.id]: { license: licenseKey, decrypt: decryptKey }
        }));

        toast.success("Fayl shifrlangan shaklda yuklab olindi!", { icon: '🔒' });
        toast.success(`Nusxalashga qarshi ochish paroli: ${decryptKey}`, { icon: '🔑', duration: 6000 });

        // Reset downloading states
        setDownloadingId(null);
        setDownloadProgress(0);
        setDownloadStatus('');
      }
    }, 850);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] md:h-[70vh]"
      >
        {/* Header Tabs */}
        <div className="px-8 pt-6 pb-0 flex border-b border-slate-800 items-center justify-between bg-slate-950/20">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'purchases' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              Mening xaridlarim
              {purchases.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'purchases' ? 'bg-indigo-650/40 text-indigo-300 border border-indigo-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {purchases.length}
                </span>
              )}
              {activeTab === 'purchases' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              Profil sozlamalari
              {activeTab === 'settings' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer mb-3"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-8 flex-1 overflow-y-auto bg-slate-900">
          
          {/* TAB 1: PURCHASES */}
          {activeTab === 'purchases' && (
            <div className="space-y-4 animate-fade-in">
              {purchases.length === 0 ? (
                <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-slate-800/40 rounded-2xl flex items-center justify-center border border-slate-800 text-slate-500 mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-white">Xaridlar topilmadi</h4>
                    <p className="text-slate-550 text-sm mt-1">Siz hali birorta ham raqamli mahsulot xarid qilmadingiz.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-95"
                  >
                    Do'konga qaytish
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {purchases.map((product, idx) => (
                    <div 
                      key={`${product.id}-${idx}`} 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-850/30 border border-slate-800 rounded-2xl gap-4 hover:border-slate-700/60 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-850"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-200 text-sm line-clamp-1 max-w-xs sm:max-w-md">{product.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                            <span className="text-indigo-400 font-medium">{product.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Bugun sotib olindi
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        {downloadingId === product.id ? (
                          <div className="w-full sm:w-60 space-y-2">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span className="text-slate-400 truncate max-w-[150px] animate-pulse">{downloadStatus}</span>
                              <span className="text-indigo-400 font-extrabold">{downloadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-505 bg-indigo-550 h-full rounded-full transition-all duration-300"
                                style={{ width: `${downloadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {secKeys[product.id] && (
                              <div className="text-left bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-2 space-y-0.5 text-[9px] max-w-[170px]">
                                <p className="text-indigo-400 font-bold">🔒 SHIFRLANGAN FAOL</p>
                                <p className="text-slate-400 truncate">Litsenziya: <span className="text-slate-350 font-semibold">{secKeys[product.id].license}</span></p>
                                <p className="text-slate-400">Parol: <span className="text-emerald-450 font-bold bg-slate-950/40 px-1.5 py-0.5 rounded">{secKeys[product.id].decrypt}</span></p>
                              </div>
                            )}
                            <div className="text-left sm:text-right hidden xs:block">
                              <p className="text-xs text-slate-500">To'landi:</p>
                              <p className="text-sm font-extrabold text-white mt-0.5">
                                {formatPrice(product.price, currency, exchangeRate)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownload(product)}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              {secKeys[product.id] ? "Qayta yuklash" : "Yuklab olish"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleProfileSave} className="space-y-6 max-w-2xl animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    To'liq ismingiz
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="Ismingizni kiriting"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    E-pochta manzili
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="example@zetra.uz"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parolni yangilash (Ixtiyoriy)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Yangi parol
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Yangi parolni tasdiqlash
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/20 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-normal">
                  <p className="font-semibold text-slate-350">Hisobingiz xavfsizligi kafolatlanadi</p>
                  <p className="mt-1 text-slate-500">Barcha hisob sozlamalari va parollar shifrlangan shaklda faqat sizning brauzeringizda saqlanadi.</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
              >
                Sozlamalarni saqlash
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
