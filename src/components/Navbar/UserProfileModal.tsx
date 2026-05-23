"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, ShoppingBag, Lock, Mail, Download, Settings, Calendar, ShieldCheck } from 'lucide-react';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';

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

const categoryTranslations: Record<string, string> = {
  'Dizayn Shablonlari': 'cat_design',
  '3D Modellar': 'cat_3d',
  'E-Kitoblar': 'cat_ebooks',
  'Dastur Kodelari': 'cat_code',
  'Grafika & Media': 'cat_graphics',
  'O\'yin va Hisoblar': 'cat_games',
  'Litsenziya & Kalitlar': 'cat_keys',
  'Audio & Musiqa': 'cat_audio'
};

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
  const { language, t } = useLanguage();

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

  const getCategoryDisplayName = (catName: string) => {
    const key = categoryTranslations[catName];
    return key ? t(key) : catName;
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error(language === 'uz' ? "Ism va E-pochta bo'sh bo'lishi mumkin emas!" : language === 'ru' ? "Ð˜Ð¼Ñ Ð¸ ÑÐ»ÐµÐºÑ‚Ñ€Ð¾Ð½Ð½Ð°Ñ Ð¿Ð¾Ñ‡Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð³ÑƒÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ð¿ÑƒÑÑ‚Ñ‹Ð¼Ð¸!" : "Name and Email cannot be empty!");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error(language === 'uz' ? "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!" : language === 'ru' ? "ÐÐ¾Ð²Ñ‹Ð¹ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ Ð½Ðµ Ð¼ÐµÐ½ÐµÐµ 6 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð¾Ð²!" : "New password must be at least 6 characters long!");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(language === 'uz' ? "Yangi parollar bir-biriga mos kelmadi!" : language === 'ru' ? "ÐÐ¾Ð²Ñ‹Ðµ Ð¿Ð°Ñ€Ð¾Ð»Ð¸ Ð½Ðµ ÑÐ¾Ð²Ð¿Ð°Ð´Ð°ÑŽÑ‚!" : "New passwords do not match!");
        return;
      }
    }

    onUpdateProfile(name, email);
    toast.success(language === 'uz' ? "Profil ma'lumotlari muvaffaqiyatli yangilandi!" : language === 'ru' ? "Ð˜Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ñ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð°!" : "Profile settings successfully updated!", { icon: 'âš™ï¸' });
    
    // Clear passwords
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDownload = (product: Product) => {
    if (downloadingId !== null) return;

    setDownloadingId(product.id);
    setDownloadProgress(0);

    const steps = [
      { p: 15, msg: t('dl_step_check') },
      { p: 40, msg: `${t('dl_step_watermark')}: ${currentUser?.email || 'ogabek@zetra.uz'}` },
      { p: 70, msg: t('dl_step_encrypt') },
      { p: 90, msg: t('dl_step_r2') },
      { p: 100, msg: t('dl_step_dl') }
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

        toast.success(language === 'uz' ? "Fayl shifrlangan shaklda yuklab olindi!" : language === 'ru' ? "Ð¤Ð°Ð¹Ð» ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑÐºÐ°Ñ‡Ð°Ð½ Ð² Ð·Ð°ÑˆÐ¸Ñ„Ñ€Ð¾Ð²Ð°Ð½Ð½Ð¾Ð¼ Ð²Ð¸Ð´Ðµ!" : "File downloaded in encrypted form!", { icon: 'ðŸ”’' });
        toast.success(
          language === 'uz' 
            ? `Nusxalashga qarshi ochish paroli: ${decryptKey}` 
            : language === 'ru' 
              ? `ÐŸÐ°Ñ€Ð¾Ð»ÑŒ Ð´Ð»Ñ Ñ€Ð°ÑÑˆÐ¸Ñ„Ñ€Ð¾Ð²ÐºÐ¸ Ð¿Ñ€Ð¾Ñ‚Ð¸Ð² ÐºÐ¾Ð¿Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ: ${decryptKey}` 
              : `Anti-copy decryption password: ${decryptKey}`, 
          { icon: 'ðŸ”‘', duration: 6000 }
        );

        // Reset downloading states
        setDownloadingId(null);
        setDownloadProgress(0);
        setDownloadStatus('');
      }
    }, 850);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full h-full sm:h-[80vh] md:h-[70vh] max-w-3xl bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header Tabs */}
        <div className="px-6 sm:px-8 pt-6 pb-0 flex border-b border-slate-800 light:border-slate-200 items-center justify-between bg-slate-950/20 light:bg-slate-100/30">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'purchases' ? 'text-indigo-400 light:text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {t('profile_my_purchases')}
              {purchases.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'purchases' 
                    ? 'bg-indigo-650/40 text-indigo-300 light:bg-indigo-50 light:text-indigo-600 border border-indigo-500/20 light:border-indigo-200' 
                    : 'bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-600'
                }`}>
                  {purchases.length}
                </span>
              )}
              {activeTab === 'purchases' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 light:bg-indigo-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'settings' ? 'text-indigo-400 light:text-indigo-600' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              {t('profile_settings')}
              {activeTab === 'settings' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 light:bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white light:text-slate-500 hover:light:text-slate-800 rounded-xl hover:bg-slate-800 hover:light:bg-slate-200 transition-colors cursor-pointer mb-3"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto bg-slate-900 light:bg-slate-50">
          
          {/* TAB 1: PURCHASES */}
          {activeTab === 'purchases' && (
            <div className="space-y-4 animate-fade-in">
              {purchases.length === 0 ? (
                <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-slate-800/40 light:bg-slate-150/50 rounded-2xl flex items-center justify-center border border-slate-800 light:border-slate-200 text-slate-500 mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-white light:text-slate-900">{t('profile_no_purchases')}</h4>
                    <p className="text-slate-550 light:text-slate-500 text-sm mt-1">{t('profile_no_purchases_sub')}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-95"
                  >
                    {t('profile_back_store')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {purchases.map((product, idx) => (
                    <div 
                      key={`${product.id}-${idx}`} 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-850/30 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl gap-4 hover:border-slate-700/60 hover:light:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-850 light:border-slate-200"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-200 light:text-slate-800 text-sm line-clamp-1 max-w-xs sm:max-w-md">{product.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-550 light:text-slate-400">
                            <span className="text-indigo-400 light:text-indigo-600 font-medium">{getCategoryDisplayName(product.category)}</span>
                            <span>â€¢</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {language === 'uz' ? 'Bugun sotib olindi' : language === 'ru' ? 'ÐšÑƒÐ¿Ð»ÐµÐ½Ð¾ ÑÐµÐ³Ð¾Ð´Ð½Ñ' : 'Purchased today'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        {downloadingId === product.id ? (
                          <div className="w-full sm:w-60 space-y-2">
                             <div className="flex justify-between text-[10px] font-semibold">
                              <span className="text-slate-450 light:text-slate-600 truncate max-w-[150px] animate-pulse">{downloadStatus}</span>
                              <span className="text-indigo-400 light:text-indigo-600 font-extrabold">{downloadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 light:bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-700/50 light:border-slate-300/40">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-505 bg-indigo-550 light:bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${downloadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {secKeys[product.id] && (
                              <div className="text-left bg-indigo-500/5 light:bg-indigo-50/50 border border-indigo-500/10 light:border-indigo-150/40 rounded-xl p-2 space-y-0.5 text-[9px] max-w-[170px]">
                                <p className="text-indigo-400 light:text-indigo-600 font-bold">ðŸ”’ {t('dl_secure_active')}</p>
                                <p className="text-slate-400 light:text-slate-500 truncate">{t('dl_license')}: <span className="text-slate-350 light:text-slate-800 font-semibold">{secKeys[product.id].license}</span></p>
                                <p className="text-slate-400 light:text-slate-500">{t('dl_decrypt_key')}: <span className="text-emerald-455 font-bold bg-slate-950/40 light:bg-slate-100 px-1.5 py-0.5 rounded light:text-slate-800">{secKeys[product.id].decrypt}</span></p>
                              </div>
                            )}
                            <div className="text-left sm:text-right hidden xs:block">
                              <p className="text-xs text-slate-500 light:text-slate-450">{t('profile_paid')}:</p>
                              <p className="text-sm font-extrabold text-white light:text-slate-900 mt-0.5">
                                {formatPrice(product.price, currency, exchangeRate)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownload(product)}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              {secKeys[product.id] ? t('profile_download_again') : t('profile_download')}
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
                  <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                    {t('profile_name_lbl')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder={language === 'uz' ? 'Ismingizni kiriting' : language === 'ru' ? 'Ð’Ð²ÐµÐ´Ð¸Ñ‚Ðµ Ð²Ð°ÑˆÐµ Ð¸Ð¼Ñ' : 'Enter your name'}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                    {t('profile_email_lbl')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                      placeholder="example@zetra.uz"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 light:border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">{t('profile_update_pass')}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 light:text-slate-650 mb-2">
                      {t('profile_new_pass')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 light:text-slate-650 mb-2">
                      {t('profile_confirm_pass')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/20 light:bg-slate-100 border border-slate-800/80 light:border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 light:text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 light:text-slate-600 leading-normal">
                  <p className="font-semibold text-slate-350 light:text-slate-800">{t('profile_security_guarantee')}</p>
                  <p className="mt-1 text-slate-550 light:text-slate-500">{t('profile_security_sub')}</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
              >
                {t('profile_save_btn')}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
