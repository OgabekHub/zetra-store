"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import Image from 'next/image';
import { X, User, ShoppingBag, Lock, Mail, Download, Settings, Calendar, ShieldCheck } from 'lucide-react';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import { changePassword, findAccountByEmail } from '@/store/accountsStore';
import type { UpdateProfileResult } from '@/store/authStore';
import { isValidEmail, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/utils/validation';
import { useModalA11y } from '@/hooks/useModalA11y';
import { getCategoryLabel } from '@/utils/categories';
import { formatDateTime } from '@/utils/locale';
import { usePersistentStore } from '@/store/usePersistentStore';
import {
  sessionsStore,
  securityLogsStore,
  sessionsFor,
  logsFor,
  createSession,
  logSecurityEvent,
  revokeOtherSessions,
} from '@/store/securityStore';
import {
  downloadLimitsStore,
  licenseKeysStore,
  entitlementKey,
  consumeDownload,
  setLicenseKeys,
  DOWNLOADS_PER_PURCHASE,
} from '@/store/purchaseStore';
import type { Currency, Product, Purchase, UserProfile } from '@/types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'purchases' | 'settings' | 'security';
  setActiveTab: (tab: 'purchases' | 'settings' | 'security') => void;
  currentUser: UserProfile | null;
  onUpdateProfile: (name: string, email: string) => UpdateProfileResult;
  purchases: Purchase[];
  currency: Currency;
  exchangeRate: number;
}

/** Bir mahsulot bo'yicha yig'ilgan xarid ma'lumoti. */
interface PurchaseEntry {
  product: Product;
  quantity: number;
  totalPaid: number;
  purchasedAt: string;
  orderId: string;
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
  // Modal yopilganda unmount bo'ladi, shuning uchun boshlang'ich qiymat
  // to'g'ridan-to'g'ri props dan olinadi. Avval buni effekt qilardi va u
  // ortiqcha render hamda `set-state-in-effect` xatosini keltirib chiqarardi.
  const [name, setName] = useState(() => currentUser?.name ?? '');
  const [email, setEmail] = useState(() => currentUser?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fieldId = useId();

  // Download simulation states
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const { language, t } = useLanguage();

  // Huquqlar barqaror `currentUser.id` bo'yicha kalitlanadi. Avval ular
  // o'zgaruvchan email'ga bog'langan edi va shu modalning o'zi email'ni
  // tahrirlashga ruxsat berardi — email'ni bir harfga o'zgartirsangiz
  // yuklab olish hisoblagichi 5/5 ga qaytardi.
  const downloadLimits = usePersistentStore(downloadLimitsStore);
  const licenseKeys = usePersistentStore(licenseKeysStore);
  const allSessions = usePersistentStore(sessionsStore);
  const allLogs = usePersistentStore(securityLogsStore);

  const sessions = useMemo(
    () => sessionsFor(allSessions, currentUser?.email),
    [allSessions, currentUser?.email],
  );
  const securityLogs = useMemo(
    () => logsFor(allLogs, currentUser?.email),
    [allLogs, currentUser?.email],
  );

  /** Bir mahsulot bir marta ko'rsatiladi; miqdor va to'langan summa yig'iladi. */
  const purchaseEntries = useMemo<PurchaseEntry[]>(() => {
    const byProduct = new Map<number, PurchaseEntry>();
    for (const purchase of purchases) {
      for (const line of purchase.lines) {
        const existing = byProduct.get(line.productId);
        const paid = Math.round(line.unitPrice * line.quantity * 100) / 100;
        if (existing) {
          existing.quantity += line.quantity;
          existing.totalPaid = Math.round((existing.totalPaid + paid) * 100) / 100;
          continue;
        }
        byProduct.set(line.productId, {
          product: line.product,
          quantity: line.quantity,
          totalPaid: paid,
          purchasedAt: purchase.purchasedAt,
          orderId: purchase.id,
        });
      }
    }
    return [...byProduct.values()];
  }, [purchases]);

  const limitFor = useCallback(
    (productId: number) => {
      if (!currentUser) return DOWNLOADS_PER_PURCHASE;
      return downloadLimits[entitlementKey(currentUser.id, productId)] ?? DOWNLOADS_PER_PURCHASE;
    },
    [currentUser, downloadLimits],
  );

  const keysFor = useCallback(
    (productId: number) =>
      currentUser ? licenseKeys[entitlementKey(currentUser.id, productId)] : undefined,
    [currentUser, licenseKeys],
  );

  // Yuklab olish taymeri ref'da: modal yopilganda u albatta to'xtatiladi.
  // Avval interval faqat lokal o'zgaruvchida edi va modal yopilgach ham
  // ishlashda davom etib, hisoblagichni kamaytirib, tostlarni chiqarardi.
  const downloadTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearDownloadTimer = useCallback(() => {
    if (downloadTimer.current !== null) {
      clearInterval(downloadTimer.current);
      downloadTimer.current = null;
    }
  }, []);

  useEffect(() => clearDownloadTimer, [clearDownloadTimer]);

  // Modal ochilganda shu qurilma uchun seans borligini ta'minlaydi.
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const email = currentUser.email;

    if (!sessionsStore.getSnapshot().some((s) => s.email === email)) {
      createSession(email);
    }
    if (!securityLogsStore.getSnapshot().some((l) => l.email === email)) {
      logSecurityEvent(email, t('log_profile_created'), 'success');
    }
    // `t` ataylab bog'liqliklarda yo'q: til almashganda yangi jurnal yozuvi
    // yaratilmasligi kerak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser]);

  const handleRevokeOtherSessions = () => {
    if (!currentUser) return;
    revokeOtherSessions(currentUser.email);
    logSecurityEvent(currentUser.email, t('log_sessions_revoked'), 'warning');
    toast.success(t('profile_sessions_revoked'), { icon: '🛡️' });
  };

  // Scroll qulfi, ESC, fokus tuzog'i va fokusni tiklash — hammasi
  // umumiy hook'da. Avval bu blok olti faylda takrorlangan edi.
  const { backdropProps, panelProps } = useModalA11y({
    isOpen,
    onClose,
    label: t('profile_title'),
  });






  if (!isOpen) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !currentUser) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      toast.error(t('profile_name_empty'));
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      toast.error(t('auth_email_invalid'));
      return;
    }

    // Email band bo'lsa, parolni o'zgartirishdan OLDIN to'xtaymiz — aks holda
    // parol almashib, profil esa saqlanmay qolardi.
    const occupant = findAccountByEmail(trimmedEmail);
    if (occupant && occupant.id !== currentUser.id) {
      toast.error(t('profile_email_taken'));
      return;
    }

    if (newPassword) {
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        toast.error(t('profile_password_too_short'));
        return;
      }
      if (newPassword.length > MAX_PASSWORD_LENGTH) {
        toast.error(t('auth_password_too_long'));
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(t('profile_password_mismatch'));
        return;
      }
    }

    setIsSaving(true);
    try {
      if (newPassword) {
        // Avval parol hech qayerga saqlanmas, UI esa "yangilandi" deb yolg'on
        // gapirardi. Endi u haqiqatan xeshlanadi va joriy parol talab qilinadi.
        const changed = await changePassword(currentUser.id, currentPassword, newPassword);
        if (!changed.ok) {
          toast.error(t(changed.reason === 'invalid-current' ? 'profile_current_password_wrong' : 'error'));
          return;
        }
        logSecurityEvent(currentUser.email, t('log_password_changed'), 'warning');
        toast.success(t('profile_password_changed'), { icon: '🔐' });
      }

      const updated = onUpdateProfile(trimmedName, trimmedEmail);
      if (!updated.ok) {
        toast.error(t(updated.reason === 'email-taken' ? 'profile_email_taken' : 'error'));
        return;
      }

      logSecurityEvent(updated.profile.email, t('log_profile_updated'), 'success');
      toast.success(t('profile_updated'), { icon: '⚙️' });
    } finally {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDownload = (product: Product) => {
    if (downloadingId !== null) return;
    if (!currentUser) return;

    if (limitFor(product.id) <= 0) {
      toast.error(t('dl_limit_reached'));
      return;
    }

    const userId = currentUser.id;
    setDownloadingId(product.id);
    setDownloadProgress(0);

    const steps = [
      { p: 15, msg: t('dl_step_check') },
      { p: 40, msg: `${t('dl_step_watermark')}: ${currentUser.email}` },
      { p: 70, msg: t('dl_step_encrypt') },
      { p: 90, msg: t('dl_step_r2') },
      { p: 100, msg: t('dl_step_dl') },
    ];

    let currentStep = 0;
    downloadTimer.current = setInterval(() => {
      if (currentStep < steps.length) {
        setDownloadProgress(steps[currentStep].p);
        setDownloadStatus(steps[currentStep].msg);
        currentStep++;
        return;
      }

      clearDownloadTimer();

      const decryptKey = `ZTR-KEY-${Math.floor(10000 + Math.random() * 90000)}`;
      setLicenseKeys(userId, product.id, {
        license: `ZTR-LIC-${Math.floor(100000 + Math.random() * 900000)}-${product.id}`,
        decrypt: decryptKey,
      });
      // Funksional yangilash — avval bu yerda ~4 soniyalik eskirgan nusxa
      // butunlay yozilib, boshqa mahsulotlar hisoblagichini ham bekor qilardi.
      consumeDownload(userId, product.id);

      toast.success(t('dl_downloaded_ok'), { icon: '🔒' });
      toast.success(`${t('dl_decrypt_password')}: ${decryptKey}`, { icon: '🔑', duration: 6000 });

      setDownloadingId(null);
      setDownloadProgress(0);
      setDownloadStatus('');
    }, 850);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div 
        {...panelProps}
        className="relative w-full h-full sm:h-[80vh] md:h-[70vh] max-w-3xl bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header Tabs */}
        <div className="px-6 sm:px-8 pt-6 pb-0 flex border-b border-slate-800 light:border-slate-200 items-center justify-between bg-slate-950/20 light:bg-slate-100/30">
          <div className="flex gap-6" role="tablist" aria-label={t('profile_title')}>
            <button
              type="button"
              role="tab"
              id={`${fieldId}-tab-purchases`}
              aria-selected={activeTab === 'purchases'}
              aria-controls={`${fieldId}-panel-purchases`}
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'purchases' ? 'text-indigo-400 light:text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {t('profile_my_purchases')}
              {purchaseEntries.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'purchases' 
                    ? 'bg-indigo-650/40 text-indigo-300 light:bg-indigo-50 light:text-indigo-600 border border-indigo-500/20 light:border-indigo-200' 
                    : 'bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-600'
                }`}>
                  {purchaseEntries.length}
                </span>
              )}
              {activeTab === 'purchases' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 light:bg-indigo-600 rounded-full" />
              )}
            </button>
            <button
              type="button"
              role="tab"
              id={`${fieldId}-tab-settings`}
              aria-selected={activeTab === 'settings'}
              aria-controls={`${fieldId}-panel-settings`}
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'settings' ? 'text-indigo-400 light:text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              {t('profile_settings')}
              {activeTab === 'settings' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 light:bg-indigo-600 rounded-full" />
              )}
            </button>
            <button
              type="button"
              role="tab"
              id={`${fieldId}-tab-security`}
              aria-selected={activeTab === 'security'}
              aria-controls={`${fieldId}-panel-security`}
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'security' ? 'text-indigo-400 light:text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              {t('profile_security_tab')}
              {activeTab === 'security' && (
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
            <div role="tabpanel" id={`${fieldId}-panel-purchases`} aria-label={t('a11y_tab_purchases')} className="space-y-4 animate-fade-in">
              {purchaseEntries.length === 0 ? (
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
                  {purchaseEntries.map(({ product, quantity, totalPaid, purchasedAt, orderId }) => (
                    <div
                      key={`${orderId}-${product.id}`}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-850/30 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl gap-4 hover:border-slate-700/60 hover:light:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-850 light:border-slate-200"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-200 light:text-slate-800 text-sm line-clamp-1 max-w-xs sm:max-w-md">{product.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-550 light:text-slate-400">
                            <span className="text-indigo-400 light:text-indigo-600 font-medium">{getCategoryLabel(product.category, t)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {t('profile_purchased_on')}: {formatDateTime(purchasedAt, language)}
                            </span>
                            <span>•</span>
                            <span>
                              {t('profile_quantity')}: <span className="font-bold">{quantity}</span>
                            </span>
                            <span>•</span>
                            <span className={`font-bold flex items-center gap-1 ${
                              limitFor(product.id) === 0
                                ? 'text-red-500'
                                : limitFor(product.id) <= 2
                                  ? 'text-amber-500'
                                  : 'text-emerald-500'
                            }`}>
                              {t('dl_remaining')}: {limitFor(product.id)}/{DOWNLOADS_PER_PURCHASE}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        {downloadingId === product.id ? (
                          <div className="w-full sm:w-60 space-y-2">
                             <div className="flex justify-between text-[10px] font-semibold" aria-live="polite">
                              <span className="text-slate-450 light:text-slate-600 truncate max-w-[150px] animate-pulse">{downloadStatus}</span>
                              <span className="text-indigo-400 light:text-indigo-600 font-extrabold">{downloadProgress}%</span>
                            </div>
                            <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={downloadProgress} aria-label={t('a11y_download_progress')} className="w-full bg-slate-800 light:bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-700/50 light:border-slate-300/40">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-505 bg-indigo-550 light:bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${downloadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {keysFor(product.id) && (
                              <div className="text-left bg-indigo-500/5 light:bg-indigo-50/50 border border-indigo-500/10 light:border-indigo-150/40 rounded-xl p-2 space-y-0.5 text-[9px] max-w-[170px]">
                                <p className="text-indigo-400 light:text-indigo-600 font-bold flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> {t('dl_secure_active')}
                                </p>
                                <p className="text-slate-400 light:text-slate-500 truncate">{t('dl_license')}: <span className="text-slate-350 light:text-slate-800 font-semibold">{keysFor(product.id)?.license}</span></p>
                                <p className="text-slate-400 light:text-slate-500">{t('dl_decrypt_key')}: <span className="text-emerald-455 font-bold bg-slate-950/40 light:bg-slate-100 px-1.5 py-0.5 rounded light:text-slate-800">{keysFor(product.id)?.decrypt}</span></p>
                              </div>
                            )}
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-slate-500 light:text-slate-450">{t('profile_paid')}:</p>
                              <p className="text-sm font-extrabold text-white light:text-slate-900 mt-0.5">
                                {formatPrice(totalPaid, currency, exchangeRate)}
                              </p>
                            </div>
                            {(() => {
                              const isLocked = limitFor(product.id) <= 0;
                              return (
                                <button
                                  onClick={() => !isLocked && handleDownload(product)}
                                  disabled={isLocked}
                                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                                    isLocked
                                      ? 'bg-slate-800 text-slate-500 border border-slate-700/40 cursor-not-allowed shadow-none light:bg-slate-200 light:text-slate-400'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 cursor-pointer'
                                  }`}
                                  title={isLocked ? t('dl_limit_reached_title') : undefined}
                                >
                                  {isLocked ? (
                                    <>
                                      <Lock className="w-4 h-4 text-slate-555" />
                                      {t('dl_limit_exceeded_btn')}
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4" />
                                      {keysFor(product.id) ? t('profile_download_again') : t('profile_download')}
                                    </>
                                  )}
                                </button>
                              );
                            })()}
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
            <form role="tabpanel" id={`${fieldId}-panel-settings`} aria-label={t('a11y_tab_settings')} onSubmit={handleProfileSave} className="space-y-6 max-w-2xl animate-fade-in" aria-busy={isSaving}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor={`${fieldId}-name`} className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                    {t('profile_name_lbl')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400" aria-hidden="true">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id={`${fieldId}-name`}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('profile_name_placeholder')}
                      autoComplete="name"
                      maxLength={80}
                      required
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`${fieldId}-email`} className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                    {t('profile_email_lbl')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400" aria-hidden="true">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id={`${fieldId}-email`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@zetra.uz"
                      autoComplete="email"
                      maxLength={254}
                      required
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 light:border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">{t('profile_update_pass')}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                  <label htmlFor={`${fieldId}-current-password`} className="block text-xs font-semibold text-slate-500 light:text-slate-650 mb-2">
                    {t('profile_current_password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400" aria-hidden="true">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id={`${fieldId}-current-password`}
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      maxLength={MAX_PASSWORD_LENGTH}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`${fieldId}-new-password`} className="block text-xs font-semibold text-slate-500 light:text-slate-650 mb-2">
                    {t('profile_new_pass')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400" aria-hidden="true">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id={`${fieldId}-new-password`}
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      maxLength={MAX_PASSWORD_LENGTH}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`${fieldId}-confirm-password`} className="block text-xs font-semibold text-slate-500 light:text-slate-650 mb-2">
                    {t('profile_confirm_pass')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400" aria-hidden="true">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id={`${fieldId}-confirm-password`}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      maxLength={MAX_PASSWORD_LENGTH}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>
                </div>
              </div>

              <div className="bg-slate-800/20 light:bg-slate-100 border border-slate-800/80 light:border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 light:text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs text-slate-400 light:text-slate-600 leading-normal">
                  <p className="font-semibold text-slate-350 light:text-slate-800">{t('profile_security_guarantee')}</p>
                  <p className="mt-1 text-slate-550 light:text-slate-500">{t('profile_security_sub')}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
              >
                {t('profile_save_btn')}
              </button>
            </form>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div role="tabpanel" id={`${fieldId}-panel-security`} aria-label={t('a11y_tab_security')} className="space-y-8 animate-fade-in max-w-3xl">
              {/* Active Sessions */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">
                    {t('profile_active_sessions')}
                  </h4>
                  {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <button
                      type="button"
                      onClick={handleRevokeOtherSessions}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/15 cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t('profile_revoke_all')}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div 
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-slate-850/30 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl gap-4"
                    >
                      <div className="flex items-center gap-4.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          session.isCurrent 
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 light:bg-indigo-50 light:text-indigo-600 light:border-indigo-200' 
                            : 'bg-slate-800/40 border-slate-800 text-slate-500 light:bg-slate-100 light:text-slate-400 light:border-slate-200'
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 light:text-slate-850 text-sm">
                              {session.device}
                            </span>
                            {session.isCurrent && (
                              <span className="text-[9px] font-extrabold bg-indigo-500/15 text-indigo-400 light:bg-indigo-50 light:text-indigo-650 px-2 py-0.5 rounded-full border border-indigo-500/10 light:border-indigo-150 uppercase tracking-wider">
                                {t('profile_session_current')}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 light:text-slate-400 mt-1">
                            {t('profile_ip_address')}: <span className="font-mono text-slate-400 light:text-slate-655">{session.ip}</span> • {t('profile_last_active')}: <span className="text-slate-400 light:text-slate-655">{new Date(session.lastActive).toLocaleTimeString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Logs */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">
                  {t('profile_security_logs')}
                </h4>

                <div className="bg-slate-850/20 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 light:border-slate-200 bg-slate-950/20 light:bg-slate-100/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="p-4">{t('profile_event')}</th>
                          <th className="p-4">{t('profile_ip_address')}</th>
                          <th className="p-4">{t('profile_device')}</th>
                          <th className="p-4">{t('profile_last_active')}</th>
                          <th className="p-4 text-center">{t('profile_status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 light:divide-slate-200">
                        {securityLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-850/10 hover:light:bg-slate-50/50 transition-colors text-slate-350 light:text-slate-700">
                            <td className="p-4 font-semibold text-slate-250 light:text-slate-850">
                              {log.event}
                            </td>
                            <td className="p-4 font-mono text-[11px]">{log.ip}</td>
                            <td className="p-4 text-[11px] truncate max-w-[130px]" title={log.device}>{log.device}</td>
                            <td className="p-4 text-[11px]">
                              {formatDateTime(log.date, language)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                log.status === 'success' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200' 
                                  : log.status === 'warning'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 light:bg-amber-50 light:text-amber-700 light:border-amber-200'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20 light:bg-red-50 light:text-red-700 light:border-red-200'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
