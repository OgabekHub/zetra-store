"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, CreditCard, Smartphone, Lock, ShieldCheck, ArrowLeft, ArrowRight, Clock, Receipt } from 'lucide-react';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  currency: 'USD' | 'UZS';
  exchangeRate: number;
  onPaymentSuccess: () => void;
}

type PaymentMethod = 'payme' | 'click' | 'uzum' | null;
type PaymentStep = 'select' | 'form' | 'sms' | 'success';

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  exchangeRate,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [step, setStep] = useState<PaymentStep>('select');
  const { language, t } = useLanguage();
  
  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(60);
  const [invoiceId] = useState(() => `ZTR-${Math.floor(100000 + Math.random() * 900000)}`);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate total price
  const totalUSD = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmountFormatted = formatPrice(totalUSD, currency, exchangeRate);

  // SMS countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'sms' && smsCountdown > 0) {
      timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, smsCountdown]);

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

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSelectMethod = (selected: PaymentMethod) => {
    setMethod(selected);
    setStep('form');
    // Set mock defaults based on payment system
    if (selected === 'payme') {
      setPhoneNumber('998 (90) 123-45-67');
    } else if (selected === 'click') {
      setPhoneNumber('998 (93) 765-43-21');
    } else {
      setPhoneNumber('998 (99) 987-65-43');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'uzum' && (!cardNumber || cardNumber.length < 16)) {
      toast.error(language === 'uz' ? "Karta raqami xato kiritildi!" : language === 'ru' ? "ÐÐµÐ²ÐµÑ€Ð½Ñ‹Ð¹ Ð½Ð¾Ð¼ÐµÑ€ ÐºÐ°Ñ€Ñ‚Ñ‹!" : "Invalid card number!");
      return;
    }
    if ((method === 'payme' || method === 'click') && !phoneNumber) {
      toast.error(language === 'uz' ? "Telefon raqami kiritilishi shart!" : language === 'ru' ? "Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ Ð½Ð¾Ð¼ÐµÑ€ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÐµÐ½!" : "Phone number is required!");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate gateway request
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('sms');
      setSmsCountdown(60);
      toast.success(t('pay_sms_sent'));
    }, 1500);
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode || smsCode.length < 4) {
      toast.error(language === 'uz' ? "SMS kodni to'liq kiriting!" : language === 'ru' ? "Ð’Ð²ÐµÐ´Ð¸Ñ‚Ðµ Ð¡ÐœÐ¡ ÐºÐ¾Ð´ Ð¿Ð¾Ð»Ð½Ð¾ÑÑ‚ÑŒÑŽ!" : "Please enter the complete OTP code!");
      return;
    }

    setIsSubmitting(true);

    // Simulate OTP validation
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
      toast.success(t('pay_success_msg'), { icon: 'ðŸŽ‰' });
    }, 2000);
  };

  const handleGoBack = () => {
    if (step === 'form') {
      setStep('select');
      setMethod(null);
    } else if (step === 'sms') {
      setStep('form');
    }
  };

  const handleFinishPayment = () => {
    onPaymentSuccess();
    onClose();
    // Reset state
    setMethod(null);
    setStep('select');
    setCardNumber('');
    setCardExpiry('');
    setSmsCode('');
  };

  // Helper formatting for credit card
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    setCardNumber(value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) {
      setCardExpiry(value.substring(0, 2) + '/' + value.substring(2));
    } else {
      setCardExpiry(value);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-lg bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2">
            {step !== 'select' && step !== 'success' && (
              <button 
                onClick={handleGoBack}
                className="p-1.5 text-slate-400 hover:text-white light:text-slate-500 hover:light:text-slate-800 rounded-lg hover:bg-slate-800 hover:light:bg-slate-200 transition-colors mr-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-lg font-bold text-white light:text-slate-900">
              {step === 'select' && t('pay_select_title')}
              {step === 'form' && `${method?.toUpperCase()} ${t('pay_form_title')}`}
              {step === 'sms' && t('pay_sms_title')}
              {step === 'success' && t('pay_success_title')}
            </h3>
          </div>
          {step !== 'success' && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white light:text-slate-500 hover:light:text-slate-800 rounded-xl hover:bg-slate-800 hover:light:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="py-6 flex-1 overflow-y-auto space-y-6">
          
          {/* STEP 1: SELECT PAYMENT METHOD */}
          {step === 'select' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-850/40 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-xs text-slate-400 light:text-slate-500 font-medium">{t('pay_total')}</p>
                  <p className="text-xl font-extrabold text-white light:text-slate-900 mt-1">{totalAmountFormatted}</p>
                </div>
                <Receipt className="w-8 h-8 text-indigo-400 light:text-indigo-600 opacity-80" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Uzum Bank Button */}
                <button
                  onClick={() => handleSelectMethod('uzum')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/10 to-indigo-950/20 hover:from-purple-900/20 hover:to-indigo-950/30 light:from-purple-50 light:to-indigo-50 hover:light:from-purple-100/80 hover:light:to-indigo-100/70 border border-purple-800/20 hover:border-purple-500/50 light:border-purple-200 hover:light:border-purple-400/70 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-purple-650/20">
                      U
                    </div>
                    <div>
                      <p className="font-bold text-white light:text-slate-900 text-sm">Uzum Bank</p>
                      <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                        {language === 'uz' ? 'Karta raqami orqali oson to\'lov' : language === 'ru' ? 'ÐŸÑ€Ð¾ÑÑ‚Ð°Ñ Ð¾Ð¿Ð»Ð°Ñ‚Ð° Ð¿Ð¾ Ð½Ð¾Ð¼ÐµÑ€Ñƒ ÐºÐ°Ñ€Ñ‚Ñ‹' : 'Easy checkout using card number'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 light:text-slate-400 group-hover:text-purple-400 transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
                </button>

                {/* Payme Button */}
                <button
                  onClick={() => handleSelectMethod('payme')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-teal-950/10 to-emerald-950/10 hover:from-teal-950/20 hover:to-emerald-950/20 light:from-teal-50 light:to-emerald-50 hover:light:from-teal-100/70 hover:light:to-emerald-100/70 border border-teal-800/20 hover:border-teal-505/50 light:border-teal-200 hover:light:border-teal-400/60 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-teal-505 bg-[#3cd2c4] flex items-center justify-center text-slate-900 font-extrabold text-lg shadow-lg shadow-teal-500/20">
                      P
                    </div>
                    <div>
                      <p className="font-bold text-white light:text-slate-900 text-sm">Payme</p>
                      <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                        {language === 'uz' ? 'Telefon raqami yoki Payme ID' : language === 'ru' ? 'ÐÐ¾Ð¼ÐµÑ€ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½Ð° Ð¸Ð»Ð¸ Payme ID' : 'Phone number or Payme ID'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 light:text-slate-400 group-hover:text-teal-400 transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
                </button>

                {/* Click Button */}
                <button
                  onClick={() => handleSelectMethod('click')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/10 to-sky-950/10 hover:from-blue-900/20 hover:to-sky-950/20 light:from-blue-50 light:to-sky-50 hover:light:from-blue-100/70 hover:light:to-sky-100/70 border border-blue-800/20 hover:border-blue-500/50 light:border-blue-200 hover:light:border-blue-400/60 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-650/20">
                      C
                    </div>
                    <div>
                      <p className="font-bold text-white light:text-slate-900 text-sm">Click Evolution</p>
                      <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                        {language === 'uz' ? 'Tezkor to\'lov havolasi va click-pin' : language === 'ru' ? 'Ð¡ÑÑ‹Ð»ÐºÐ° Ð±Ñ‹ÑÑ‚Ñ€Ð¾Ð³Ð¾ Ð¿Ð»Ð°Ñ‚ÐµÐ¶Ð° Ð¸ click-pin' : 'Express billing link and click-pin'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 light:text-slate-400 group-hover:text-blue-400 transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                </button>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-850/20 light:bg-slate-100 border border-slate-800 light:border-slate-200 p-4 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-indigo-400 light:text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 light:text-slate-600 leading-normal">
                  {t('pay_ssl_info')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT DETAILS FORM */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-slate-850/40 light:bg-white p-4 rounded-2xl border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 light:text-slate-500">{t('pay_total')}</span>
                <span className="text-sm font-extrabold text-white light:text-slate-900">{totalAmountFormatted}</span>
              </div>

              {method === 'uzum' ? (
                // Uzum Bank: Card Input
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('pay_card_number')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                        <CreditCard className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                        onChange={handleCardNumberChange}
                        className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all"
                        placeholder="8600 0000 0000 0000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                        {t('pay_expiry')}
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-center transition-all"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                        {t('pay_expiry').split(' ')[0]} {t('pay_sms_info').split(' ')[2]}
                      </label>
                      <div className="block w-full py-3 border border-slate-800/50 light:border-slate-200 rounded-2xl bg-slate-950/20 light:bg-slate-100 text-slate-500 light:text-slate-450 text-xs text-center font-medium">
                        {t('pay_sms_info')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Payme & Click: Phone input
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                      {t('pay_phone_number')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                        <Smartphone className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={`block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 text-sm transition-all ${
                          method === 'payme' ? 'focus:ring-teal-500/50 focus:border-teal-500' : 'focus:ring-blue-500/50 focus:border-blue-500'
                        }`}
                        placeholder="998 (90) 000-00-00"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 light:text-slate-450 leading-relaxed">
                    {t('pay_phone_info')}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] text-sm cursor-pointer flex items-center justify-center gap-2 ${
                  isSubmitting 
                    ? 'bg-slate-800 light:bg-slate-200 text-slate-500 light:text-slate-400 pointer-events-none' 
                    : method === 'uzum' 
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/10' 
                      : method === 'payme' 
                        ? 'bg-[#3cd2c4] hover:bg-[#2cb2a4] text-slate-900 shadow-teal-500/10' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    {t('pay_btn_connect')}
                  </>
                ) : (
                  <>
                    {t('pay_btn_submit')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: SMS CODE VERIFICATION */}
          {step === 'sms' && (
            <form onSubmit={handleSmsSubmit} className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-indigo-500/10 light:bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 light:text-indigo-600 mx-auto border border-indigo-500/20 light:border-indigo-200">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400 light:text-slate-600">{t('pay_sms_sent')}</p>
                <p className="text-[10px] text-slate-550 light:text-slate-450">{t('pay_sms_code_placeholder')}</p>
              </div>

              <div className="max-w-[200px] mx-auto">
                <input
                  type="text"
                  maxLength={4}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full py-3.5 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-lg tracking-[1.5em] text-center font-bold"
                  placeholder="0000"
                  required
                />
              </div>

              <div className="text-center">
                {smsCountdown > 0 ? (
                  <p className="text-xs text-slate-500 light:text-slate-450 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {t('pay_sms_countdown')}: {smsCountdown} {t('pay_sms_seconds')}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSmsCountdown(60);
                      toast.success(language === 'uz' ? "SMS kod qayta yuborildi!" : language === 'ru' ? "Ð¡ÐœÐ¡ ÐºÐ¾Ð´ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½ Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€Ð½Ð¾!" : "OTP code resent successfully!");
                    }}
                    className="text-xs text-indigo-400 light:text-indigo-600 hover:text-indigo-300 hover:light:text-indigo-500 font-semibold cursor-pointer"
                  >
                    {t('pay_sms_countdown')}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    {t('pay_btn_verify')}
                  </>
                ) : (
                  t('pay_btn_verify_confirm')
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 'success' && (
            <div className="text-center space-y-6 animate-scale-up py-4">
              <div className="w-16 h-16 bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 light:border-emerald-200 rounded-full flex items-center justify-center text-emerald-455 light:text-emerald-600 mx-auto scale-110">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-white light:text-slate-900">{t('pay_success_msg')}</h4>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-1">{t('pay_success_sub')}</p>
              </div>

              {/* Receipt invoice details */}
              <div className="bg-slate-850/30 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-5 text-left text-xs space-y-3 relative overflow-hidden shadow-sm">
                <div className="flex justify-between">
                  <span className="text-slate-550 light:text-slate-450">{t('pay_receipt_id')}</span>
                  <span className="font-semibold text-slate-200 light:text-slate-800">{invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-555 light:text-slate-450">{t('pay_date')}</span>
                  <span className="font-semibold text-slate-200 light:text-slate-800">
                    {new Date().toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550 light:text-slate-450">{t('pay_method')}</span>
                  <span className="font-semibold text-slate-200 light:text-slate-800 uppercase">{method}</span>
                </div>
                
                <div className="border-t border-slate-800 light:border-slate-200 my-2 pt-2">
                  <span className="text-[10px] text-slate-550 light:text-slate-450 font-bold uppercase tracking-wider block mb-2">{t('pay_items_purchased')}</span>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300 light:text-slate-700">
                        <span className="truncate max-w-[200px]">{item.title}</span>
                        <span>{formatPrice(item.price * item.quantity, currency, exchangeRate)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-800 light:border-slate-200 pt-2 text-sm font-extrabold text-white light:text-slate-900">
                  <span>{t('pay_total_paid')}</span>
                  <span className="text-emerald-450 light:text-emerald-600">{totalAmountFormatted}</span>
                </div>
                
                {/* Watermark security note */}
                <div className="text-[9px] text-indigo-400 light:text-indigo-600 bg-indigo-500/5 light:bg-indigo-50 p-2 rounded-lg border border-indigo-550/10 light:border-indigo-100 text-center font-medium mt-3">
                  {t('pay_invoice_secure')}
                </div>
              </div>

              <button
                onClick={handleFinishPayment}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
              >
                {t('pay_go_purchases')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
