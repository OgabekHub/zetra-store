"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, CreditCard, Smartphone, Lock, ShieldCheck, ArrowLeft, ArrowRight, Clock, Receipt, Check, KeyRound } from 'lucide-react';
import { formatPrice } from '@/utils/price';
import { LOCALE_TAG } from '@/utils/locale';
import {
  luhnCheck,
  formatCardNumber,
  formatCardExpiry,
  isValidCardExpiry,
  isValidUzPhone,
  formatUzPhone,
  digitsOnly,
} from '@/utils/validation';
import { CartItem, Currency } from '@/types';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import { useModalA11y } from '@/hooks/useModalA11y';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import uzumLogo from '@/assets/images/uzum-logo.png';
import paymeLogo from '@/assets/images/payme-logo.png';
import clickLogoDark from '@/assets/images/click-logo-dark.png';
import clickLogoLight from '@/assets/images/click-logo-light.png';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  exchangeRate: number;
  onPaymentSuccess: () => void;
}

type PaymentMethod = 'payme' | 'click' | 'uzum' | null;
type PaymentStep = 'select' | 'form' | 'sms' | 'pin' | 'app_confirm' | 'uzum_wallet' | 'success';

// Premium Inline SVGs for Card Brands
const UzcardLogo = () => (
  <svg className="w-9 h-6 rounded border border-slate-700/50" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="60" rx="4" fill="#0C4A6E" />
    <circle cx="50" cy="30" r="18" fill="#0284C7" />
    <path d="M42 22H58V25H42V22ZM42 35H58V38H42V35Z" fill="#FFFFFF" />
    <path d="M48 26H52V34H48V26Z" fill="#FFFFFF" />
    <path d="M35 15H65V18H35V15ZM35 42H65V45H35V42Z" fill="#38BDF8" opacity="0.8" />
  </svg>
);

const HumoLogo = () => (
  <svg className="w-9 h-6 rounded border border-slate-700/50" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="60" rx="4" fill="#065F46" />
    <path d="M25 25C35 32 35 40 25 47C35 43 45 43 55 47C45 40 45 32 55 25C45 29 35 29 25 25Z" fill="#34D399" />
    <circle cx="68" cy="30" r="8" fill="#FBBF24" />
    <path d="M58 20L78 30L58 40" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VisaLogo = () => (
  <svg className="w-9 h-6 rounded border border-slate-700/50" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="60" rx="4" fill="#1A1F71" />
    <path d="M15 18L23 42H29L34 18H28L25 34L22 18H15ZM37 18L40 42H46L43 18H37ZM53 18C49 18 46 20 46 23C46 27 52 26 52 29C52 31 49 32 46 32C43 32 41 30 41 30L39 35C39 35 42 36 45 36C49 36 57 34 57 29C57 24 51 24 51 22C51 20 54 19 56 19C59 19 61 21 61 21L63 16C63 16 60 18 53 18ZM68 18L63 42H69L74 18H68Z" fill="#FFF" />
    <path d="M24 18L23 23H29L30 18H24Z" fill="#F7B600" />
  </svg>
);

const MastercardLogo = () => (
  <svg className="w-9 h-6 rounded border border-slate-700/50" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="60" rx="4" fill="#1E293B" />
    <circle cx="42" cy="30" r="16" fill="#EB001B" />
    <circle cx="58" cy="30" r="16" fill="#F79E1B" opacity="0.9" />
    <path d="M50 19C46.5 21.8 44.5 25.8 44.5 30C44.5 34.2 46.5 38.2 50 41C53.5 38.2 55.5 34.2 55.5 30C55.5 25.8 53.5 21.8 50 19Z" fill="#FF5F00" />
  </svg>
);

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  exchangeRate,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [subMethod, setSubMethod] = useState<'card' | 'phone'>('card');
  const [step, setStep] = useState<PaymentStep>('select');
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const clickLogo = theme === 'dark' ? clickLogoDark : clickLogoLight;
  
  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [clickPin, setClickPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(60);
  const [invoiceId] = useState(() => `ZTR-${Math.floor(100000 + Math.random() * 900000)}`);
  
  // In-app phone notification simulation states
  const [appNotificationVisible, setAppNotificationVisible] = useState(false);
  const [appConfirmStep, setAppConfirmStep] = useState<'notification' | 'app_view' | 'loading' | 'success'>('notification');


  // Calculate total price
  const totalUSD = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmountFormatted = formatPrice(totalUSD, currency, exchangeRate);

  // Card Brand Detection Logic
  const detectCardBrand = (number: string): 'uzcard' | 'humo' | 'visa' | 'mastercard' | null => {
    const clean = number.replace(/\D/g, '');
    if (clean.startsWith('8600')) return 'uzcard';
    if (clean.startsWith('9860')) return 'humo';
    if (clean.startsWith('4')) return 'visa';
    if (clean.startsWith('5')) return 'mastercard';
    return null;
  };
  const cardBrand = detectCardBrand(cardNumber);

  // Fetch color variables based on payment provider
  const getBrandColors = () => {
    switch (method) {
      case 'payme':
        return {
          bg: 'bg-[#3cd2c4] hover:bg-[#2cb2a4]',
          text: 'text-[#3cd2c4]',
          border: 'border-[#3cd2c4]/30',
          accent: '#3cd2c4',
          ring: 'focus:ring-[#3cd2c4]/50 focus:border-[#3cd2c4]',
          badge: 'bg-[#3cd2c4]/10 text-[#3cd2c4] border-[#3cd2c4]/20',
          gradient: 'from-[#3cd2c4]/10 to-[#1e4e4a]/10',
          logoColor: 'text-[#3cd2c4]'
        };
      case 'click':
        return {
          bg: 'bg-blue-600 hover:bg-blue-700',
          text: 'text-blue-400 light:text-blue-600',
          border: 'border-blue-500/30',
          accent: '#2563eb',
          ring: 'focus:ring-blue-500/50 focus:border-blue-500',
          badge: 'bg-blue-500/10 text-blue-450 light:text-blue-600 border-blue-500/20',
          gradient: 'from-blue-900/10 to-indigo-950/10',
          logoColor: 'text-blue-500'
        };
      case 'uzum':
      default:
        return {
          bg: 'bg-purple-600 hover:bg-purple-700',
          text: 'text-purple-400 light:text-purple-650',
          border: 'border-purple-500/30',
          accent: '#7c3aed',
          ring: 'focus:ring-purple-500/50 focus:border-purple-500',
          badge: 'bg-purple-500/10 text-purple-400 light:text-purple-600 border-purple-500/20',
          gradient: 'from-purple-900/10 to-indigo-950/15',
          logoColor: 'text-purple-500'
        };
    }
  };
  const colors = getBrandColors();

  // SMS countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'sms' && smsCountdown > 0) {
      timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, smsCountdown]);

  /**
   * Xaridni yakunlaydi.
   *
   * Kvitansiya bosqichida modalni yopishning HAR QANDAY yo'li shu yerga olib
   * keladi — ESC ham, fon bosish ham, X tugmasi ham. Avval ular oddiy
   * `onClose()` ni chaqirardi, `onPaymentSuccess()` esa faqat "Xaridlarim"
   * tugmasida ishlardi: kvitansiya "To'landi" deb turar, foydalanuvchi ESC
   * bosardi, savat tozalanmasdi va xarid umuman yozilmasdi.
   */
  const handleFinishPayment = () => {
    onPaymentSuccess();
    onClose();
  };

  /** Yopish so'rovi: kvitansiyada u xaridni bekor qilmaydi, yakunlaydi. */
  const requestClose = () => {
    if (step === 'success') {
      handleFinishPayment();
      return;
    }
    onClose();
  };

  // Scroll qulfi, ESC, fokus tuzog'i va fokusni tiklash umumiy hook'da.
  // `onClose` emas, `requestClose` beriladi: kvitansiya bosqichida yopish
  // xaridni bekor qilmaydi, yakunlaydi.
  const { backdropProps, panelProps } = useModalA11y({
    isOpen,
    onClose: requestClose,
    label: t('pay_title'),
  });

  if (!isOpen) return null;


  const handleSelectMethod = (selected: PaymentMethod) => {
    setMethod(selected);
    setSubMethod('card');
    setStep('form');
    setCardNumber('');
    setCardExpiry('');
    setPhoneNumber('');
    setClickPin('');
    setSmsCode('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (subMethod === 'card') {
      // Uzunlik tekshiruvi `0000 0000 0000 0000` ni ham qabul qilardi.
      if (!luhnCheck(cardNumber)) {
        toast.error(t('pay_card_invalid'));
        return;
      }
      // Avval `99/99` va `13/24` ham o'tib ketardi.
      if (!isValidCardExpiry(cardExpiry)) {
        toast.error(t('pay_expiry_invalid'));
        return;
      }
    } else {
      // Avval faqat uzunlik tekshirilardi, ya'ni "abcdefghi" ham
      // "muvaffaqiyatli" to'lovga olib borardi.
      if (!isValidUzPhone(phoneNumber)) {
        toast.error(t('pay_invalid_phone_number'));
        return;
      }
    }

    setIsSubmitting(true);
    
    // Simulate gateway request
    setTimeout(() => {
      setIsSubmitting(false);

      if (method === 'payme' && subMethod === 'phone') {
        // Trigger Smartphone overlay app confirm
        setStep('app_confirm');
        setAppConfirmStep('notification');
        setAppNotificationVisible(true);
      } else if (method === 'click') {
        // Go to click pin step
        setStep('pin');
      } else if (method === 'uzum' && subMethod === 'phone') {
        // Uzum login phone flow -> goes to SMS login
        setStep('sms');
        setSmsCountdown(60);
        toast.success(t('pay_sms_sent'));
      } else {
        // Standard Card Payment -> SMS-OTP
        setStep('sms');
        setSmsCountdown(60);
        toast.success(t('pay_sms_sent'));
      }
    }, 1200);
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode || smsCode.length < 4) {
      toast.error(t('auth_please_enter_the_complete_otp_code'));
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (method === 'uzum' && subMethod === 'phone') {
        // Go to Uzum Pay Wallet select screen
        setStep('uzum_wallet');
      } else {
        setStep('success');
        toast.success(t('pay_success_msg'), { icon: '🎉' });
      }
    }, 1500);
  };

  // Click PIN keypad click handler
  const handleKeypadPress = (num: string) => {
    if (num === 'back') {
      setClickPin(prev => prev.slice(0, -1));
    } else if (num === 'clear') {
      setClickPin('');
    } else {
      if (clickPin.length < 4) {
        setClickPin(prev => prev + num);
      }
    }
  };

  // Submit Click PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clickPin.length < 4) {
      toast.error(t('pay_pin_invalid'));
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
      toast.success(t('pay_success_msg'), { icon: '🎉' });
    }, 1600);
  };

  const handleUzumWalletPay = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
      toast.success(t('pay_success_msg'), { icon: '🎉' });
    }, 1500);
  };

  // Payme app confirmation flow actions
  const triggerAppConfirmApprove = () => {
    setAppConfirmStep('loading');
    setTimeout(() => {
      setAppConfirmStep('success');
      setTimeout(() => {
        setStep('success');
        toast.success(t('pay_success_msg'), { icon: '🎉' });
      }, 1000);
    }, 1500);
  };

  const triggerAppConfirmReject = () => {
    toast.error(t('pay_payment_rejected'));
    setStep('form');
  };

  const handleGoBack = () => {
    if (step === 'form') {
      setStep('select');
      setMethod(null);
    } else if (step === 'sms') {
      setStep('form');
    } else if (step === 'pin') {
      setStep('form');
    } else if (step === 'app_confirm') {
      setStep('form');
    } else if (step === 'uzum_wallet') {
      setStep('form');
    }
  };


  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(digitsOnly(e.target.value).slice(0, 16));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // O'chirish holati alohida ko'riladi: avval `"12/"` da backspace
    // bosilsa qiymat yana `"12/"` ga qaytardi va foydalanuvchi xato
    // yozilgan oyni hech qachon o'chira olmasdi.
    setCardExpiry(formatCardExpiry(e.target.value, cardExpiry));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatUzPhone(e.target.value));
  };

  const renderCardLogo = (brand: 'uzcard' | 'humo' | 'visa' | 'mastercard' | null) => {
    switch (brand) {
      case 'uzcard': return <UzcardLogo />;
      case 'humo': return <HumoLogo />;
      case 'visa': return <VisaLogo />;
      case 'mastercard': return <MastercardLogo />;
      default: return <CreditCard className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
      {...backdropProps}
    >
      <div 
        {...panelProps}
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-lg bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 transition-all duration-300"
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
            <h3 className="text-lg font-bold text-white light:text-slate-900 flex items-center gap-2">
              {step === 'select' && t('pay_select_title')}
              {step === 'form' && (
                <>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${colors.badge}`}>
                    {method}
                  </span>
                  <span>{t('pay_form_title')}</span>
                </>
              )}
              {step === 'sms' && t('pay_sms_title')}
              {step === 'pin' && t('pay_pin_lbl')}
              {step === 'app_confirm' && t('pay_app_notification_waiting')}
              {step === 'uzum_wallet' && (t('pay_uzum_pay_wallet'))}
              {step === 'success' && t('pay_success_title')}
            </h3>
          </div>
          {(
            <button
              type="button"
              aria-label={t('close')}
              onClick={requestClose}
              className="p-2 text-slate-400 hover:text-white light:text-slate-500 hover:light:text-slate-800 rounded-xl hover:bg-slate-800 hover:light:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="py-5 flex-1 overflow-y-auto space-y-6">
          
          {/* STEP 1: SELECT PAYMENT METHOD */}
          {step === 'select' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-850/40 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-xs text-slate-400 light:text-slate-500 font-medium">{t('pay_total')}</p>
                  <p className="text-2xl font-extrabold text-white light:text-slate-900 mt-1">{totalAmountFormatted}</p>
                </div>
                <Receipt className="w-9 h-9 text-indigo-400 light:text-indigo-600 opacity-80" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Uzum Bank Button */}
                <button
                  onClick={() => handleSelectMethod('uzum')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/10 to-indigo-950/20 hover:from-purple-900/20 hover:to-indigo-950/30 light:from-purple-50 light:to-indigo-50 hover:light:from-purple-100/85 hover:light:to-indigo-100/80 border border-purple-800/20 hover:border-purple-500/50 light:border-purple-200 hover:light:border-purple-400 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-12 flex items-center justify-center flex-shrink-0">
                      <Image 
                        src={uzumLogo} 
                        alt="Uzum Bank" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-white light:text-slate-900 text-sm">Uzum Bank</p>
                      <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                        {t('pay_card_or_uzum_pay_checkout')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 light:text-slate-450 group-hover:text-purple-450 transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
                </button>

                {/* Payme Button */}
                <button
                  onClick={() => handleSelectMethod('payme')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-teal-950/10 to-emerald-950/10 hover:from-teal-950/20 hover:to-emerald-950/20 light:from-teal-50 light:to-emerald-50 hover:light:from-teal-100/80 hover:light:to-emerald-100/80 border border-teal-800/20 hover:border-teal-400/50 light:border-teal-200 hover:light:border-teal-400 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-12 flex items-center justify-center flex-shrink-0">
                      <Image 
                        src={paymeLogo} 
                        alt="Payme" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-white light:text-slate-900 text-sm">Payme</p>
                      <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                        {t('pay_card_or_phone_number_billing')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 light:text-slate-450 group-hover:text-[#3cd2c4] transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
                </button>

                {/* Click Button */}
                <button
                  onClick={() => handleSelectMethod('click')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/10 to-sky-950/10 hover:from-blue-900/20 hover:to-sky-950/20 light:from-blue-50 light:to-sky-50 hover:light:from-blue-100/80 hover:light:to-sky-100/80 border border-blue-800/20 hover:border-blue-500/50 light:border-blue-200 hover:light:border-blue-400 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-12 flex items-center justify-center flex-shrink-0">
                      <Image 
                        src={clickLogo} 
                        alt="Click Evolution" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-white light:text-slate-900 text-sm">Click Evolution</p>
                      <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                        {t('pay_card_with_click_pin_or_express_invoice')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 light:text-slate-450 group-hover:text-blue-450 transition-colors relative z-10" />
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

          {/* STEP 2: PAYMENT DETAILS FORM (CARD OR PHONE SUB-METHODS) */}
          {step === 'form' && (
            <div className="space-y-6 px-1 animate-fade-in">
              {/* Brand Summary */}
              <div className="flex justify-between items-center bg-slate-850/40 light:bg-white p-4 rounded-2xl border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 light:text-slate-500">{t('pay_total')}</span>
                <span className="text-base font-extrabold text-white light:text-slate-900">{totalAmountFormatted}</span>
              </div>

              {/* Sub-tabs to choose Card or Phone */}
              <div className="grid grid-cols-2 p-1 bg-slate-950/40 light:bg-slate-200/60 rounded-xl border border-slate-850 light:border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setSubMethod('card')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    subMethod === 'card' 
                      ? `${colors.bg} text-white shadow-md` 
                      : 'text-slate-450 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-850'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  {t('pay_card_method_option')}
                </button>
                <button
                  type="button"
                  onClick={() => setSubMethod('phone')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    subMethod === 'phone' 
                      ? `${colors.bg} text-white shadow-md` 
                      : 'text-slate-450 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-850'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  {t('pay_phone_method_option')}
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {subMethod === 'card' ? (
                  // Card number and expiry input
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
                          value={formatCardNumber(cardNumber)}
                          onChange={handleCardNumberChange}
                          inputMode="numeric"
                          autoComplete="cc-number"
                          className={`block w-full pl-11 pr-14 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 text-sm transition-all ${colors.ring}`}
                          placeholder="8600 0000 0000 0000"
                          required
                        />
                        <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none">
                          {renderCardLogo(cardBrand)}
                        </div>
                      </div>
                      {cardBrand && (
                        <p className="text-[10px] font-bold text-slate-450 light:text-slate-550 mt-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {t('pay_card_type_detected')}{' '}
                          <span className={`uppercase font-extrabold ${colors.text}`}>{cardBrand}</span>
                        </p>
                      )}
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
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          className={`block w-full px-4 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 text-sm text-center transition-all ${colors.ring}`}
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                          {t('pay_verification')}
                        </label>
                        <div className="block w-full py-3 border border-slate-800/50 light:border-slate-200 rounded-2xl bg-slate-950/20 light:bg-slate-100 text-slate-500 light:text-slate-450 text-xs text-center font-bold">
                          {method === 'click' ? 'Click PIN' : t('pay_sms_info')}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Phone number input for app invoice / click express
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
                          onChange={handlePhoneChange}
                          inputMode="tel"
                          autoComplete="tel"
                          maxLength={12}
                          className={`block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 text-sm transition-all ${colors.ring}`}
                          placeholder="998 (90) 000-00-00"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 light:text-slate-450 leading-relaxed bg-slate-950/20 light:bg-slate-100 p-3 rounded-xl border border-slate-850 light:border-slate-200/50">
                      {method === 'payme' 
                        ? t('pay_app_notification_desc') 
                        : method === 'click'
                          ? (t('pay_click_app_hint'))
                          : t('pay_phone_info')
                      }
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] text-sm cursor-pointer flex items-center justify-center gap-2 ${
                    isSubmitting 
                      ? 'bg-slate-800 light:bg-slate-200 text-slate-500 light:text-slate-400 pointer-events-none' 
                      : `${colors.bg} text-white`
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
            </div>
          )}

          {/* STEP 3: SMS CODE VERIFICATION */}
          {step === 'sms' && (
            <form onSubmit={handleSmsSubmit} className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-indigo-500/10 light:bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 light:text-indigo-600 mx-auto border border-indigo-500/20 light:border-indigo-200">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400 light:text-slate-600">{t('pay_sms_sent')}</p>
                <p className="text-[10px] text-slate-550 light:text-slate-455">{t('pay_sms_code_placeholder')}</p>
              </div>

              <div className="max-w-[200px] mx-auto">
                <input
                  type="text"
                  maxLength={4}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
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
                      toast.success(t('pay_otp_code_resent_successfully'));
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

          {/* STEP 4: CLICK PIN VERIFICATION (INTERACTIVE KEYPAD) */}
          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-5 animate-fade-in max-w-sm mx-auto">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 bg-blue-500/10 light:bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto border border-blue-500/20 light:border-blue-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-350 light:text-slate-750">{t('pay_pin_lbl')}</p>
                <p className="text-[10px] text-slate-500 light:text-slate-450 leading-relaxed">{t('pay_pin_info')}</p>
              </div>

              {/* Dots representing entered digits */}
              <div className="flex justify-center gap-4 py-2">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                      i < clickPin.length 
                        ? 'bg-blue-500 border-blue-500 scale-110 shadow-md shadow-blue-500/30' 
                        : 'border-slate-700 bg-slate-950/20 light:border-slate-300 light:bg-slate-100'
                    }`}
                  />
                ))}
              </div>

              {/* Interactive Virtual Keypad */}
              <div className="grid grid-cols-3 gap-2 px-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleKeypadPress(val)}
                    className="py-3 text-sm font-extrabold text-slate-200 light:text-slate-800 bg-slate-850/50 light:bg-slate-200/50 hover:bg-slate-800 hover:light:bg-slate-300 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    {val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('clear')}
                  className="py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center uppercase"
                >
                  {t('pay_clear')}
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 text-sm font-extrabold text-slate-200 light:text-slate-800 bg-slate-850/50 light:bg-slate-200/50 hover:bg-slate-800 hover:light:bg-slate-300 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('back')}
                  className="py-3 text-xs font-bold text-slate-450 hover:bg-slate-800 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || clickPin.length < 4}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:light:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] text-sm cursor-pointer flex items-center justify-center gap-2 mt-4"
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

          {/* STEP 5: APP NOTIFICATION CONFIRMATION (PAYME PHONE STREAM WITH SMARTPHONE MOCKUP) */}
          {step === 'app_confirm' && (
            <div className="animate-fade-in space-y-6 flex flex-col items-center py-2">
              <div className="text-center space-y-1">
                <span className="inline-block text-[10px] font-extrabold bg-[#3cd2c4]/15 text-[#3cd2c4] px-2.5 py-0.5 rounded-full border border-[#3cd2c4]/20 uppercase tracking-wide">
                  Payme Invoice Stream
                </span>
                <h4 className="text-sm font-bold text-slate-300 light:text-slate-750 mt-2">{t('pay_app_notification_sent')}</h4>
                <p className="text-[10px] text-slate-500 light:text-slate-450 max-w-sm">{t('pay_app_notification_desc')}</p>
              </div>

              {/* Smartphone Mockup */}
              <div className="relative w-56 h-[300px] bg-slate-950 border-[6px] border-slate-800 rounded-[30px] overflow-hidden shadow-2xl flex flex-col items-center">
                {/* Phone Notch */}
                <div className="absolute top-0 w-24 h-4 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-900 rounded-full" />
                </div>

                {/* Status Bar */}
                <div className="w-full px-4 pt-1.5 pb-1 flex justify-between items-center text-[8px] font-bold text-slate-500 relative z-10">
                  <span>19:22</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-3.5 h-1.75 border border-slate-655 rounded-sm p-0.5 flex items-center">
                      <div className="w-full h-full bg-slate-500 rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* Screen Wallpaper Content */}
                <div className="flex-1 w-full bg-gradient-to-b from-[#115e59]/30 via-slate-900 to-slate-950 p-2.5 flex flex-col justify-start relative">
                  
                  {appConfirmStep === 'notification' && appNotificationVisible && (
                    /* Sliding Notification Panel */
                    <button type="button" 
                      onClick={() => setAppConfirmStep('app_view')}
                      className="w-full bg-slate-900/90 border border-[#3cd2c4]/30 rounded-2xl p-2.5 shadow-lg shadow-teal-950/20 space-y-1.5 cursor-pointer hover:border-[#3cd2c4]/70 active:scale-95 transition-all mt-4 animate-bounce block text-left"
                    >
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-8 h-4 relative flex items-center justify-center flex-shrink-0">
                            <Image 
                              src={paymeLogo} 
                              alt="Payme" 
                              className="w-full h-full object-contain" 
                            />
                          </span>
                          <span className="text-[9px] font-bold text-white">Payme</span>
                        </span>
                        <span className="text-[7px] text-slate-500">now</span>
                      </span>
                      <span>
                        <span className="block text-[8px] font-extrabold text-[#3cd2c4]">{t('pay_new_invoice')}</span>
                        <span className="block text-[7px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                          Zetra Store: {totalAmountFormatted} {t('pay_amount_suffix')}. {t('pay_tap_to_confirm')}
                        </span>
                      </span>
                    </button>
                  )}

                  {appConfirmStep === 'app_view' && (
                    /* Expanded App screen inside Phone Mockup */
                    <div className="flex-1 flex flex-col justify-between animate-fade-in py-2">
                      <div className="text-center space-y-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">{t('pay_details_title')}</span>
                        <p className="text-[9px] font-bold text-white truncate">Zetra Store</p>
                        <p className="text-xs font-black text-[#3cd2c4]">{totalAmountFormatted}</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-xl text-[7px] text-slate-400 space-y-0.5">
                          <p>{t('pay_card_label')} <span className="text-slate-200 font-bold">Humo (*9876)</span></p>
                          <p>{t('pay_type_label')} <span className="text-slate-200">Personal Vault</span></p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={triggerAppConfirmReject}
                            className="py-2 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400 font-extrabold text-[8px] rounded-lg cursor-pointer active:scale-95 transition-all text-center uppercase"
                          >
                            {t('pay_decline')}
                          </button>
                          <button
                            type="button"
                            onClick={triggerAppConfirmApprove}
                            className="py-2 bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-450 font-extrabold text-[8px] rounded-lg cursor-pointer active:scale-95 transition-all text-center uppercase"
                          >
                            {t('pay_confirm_short')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {appConfirmStep === 'loading' && (
                    /* Spinner view */
                    <div className="flex-1 flex flex-col items-center justify-center space-y-2 animate-fade-in">
                      <div className="w-6 h-6 border-2 border-slate-800 border-t-[#3cd2c4] rounded-full animate-spin" />
                      <span className="text-[8px] text-slate-400 font-medium">{t('pay_app_notification_waiting')}</span>
                    </div>
                  )}

                  {appConfirmStep === 'success' && (
                    /* Checkmark view inside Phone Mockup */
                    <div className="flex-1 flex flex-col items-center justify-center space-y-2 animate-scale-up">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-wider">{t('success')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: UZUM PAY WALLET PREVIEW & TO'LOV TUGMASI */}
          {step === 'uzum_wallet' && (
            <div className="animate-fade-in space-y-5 max-w-sm mx-auto">
              <div className="bg-purple-500/5 border border-purple-500/15 p-4 rounded-2xl space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-5 relative flex items-center justify-center flex-shrink-0">
                      <Image 
                        src={uzumLogo} 
                        alt="Uzum Bank" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 light:text-slate-850">Hamyoni</span>
                  </div>
                  <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {t('pay_wallet_active')}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-slate-500 light:text-slate-450">{t('pay_wallet_balance')}</p>
                  <p className="text-xl font-black text-white light:text-slate-900 mt-0.5">1 250 000 UZS</p>
                </div>
              </div>

              {/* Mock cards selection inside Uzum Pay */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 light:text-slate-450 uppercase tracking-wider">{t('pay_pay_by_card')}</span>
                <div className="p-3 bg-slate-950/40 light:bg-white border border-slate-800 light:border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HumoLogo />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-200 light:text-slate-800">Humo (*4321)</p>
                      <p className="text-[9px] text-slate-500 light:text-slate-450">Ogabek Olimjonov</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-purple-650 flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUzumWalletPay}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-purple-650 hover:bg-purple-750 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    {t('pay_btn_verify')}
                  </>
                ) : (
                  <>
                    {t('pay_pay_with_uzum')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 7: SUCCESS RECEIPT */}
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
                  <span className="text-slate-550 light:text-slate-455">{t('pay_receipt_id')}</span>
                  <span className="font-semibold text-slate-200 light:text-slate-850">{invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550 light:text-slate-455">{t('pay_date')}</span>
                  <span className="font-semibold text-slate-200 light:text-slate-850">
                    {new Date().toLocaleDateString(LOCALE_TAG[language], { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550 light:text-slate-455">{t('pay_method')}</span>
                  <span className="font-semibold text-slate-200 light:text-slate-850 uppercase">{method} ({subMethod})</span>
                </div>
                
                <div className="border-t border-slate-800 light:border-slate-200 my-2 pt-2">
                  <span className="text-[10px] text-slate-550 light:text-slate-455 font-bold uppercase tracking-wider block mb-2">{t('pay_items_purchased')}</span>
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
                <div className="text-[9px] text-indigo-400 light:text-indigo-650 bg-indigo-500/5 light:bg-indigo-50 p-2.5 rounded-lg border border-indigo-500/10 light:border-indigo-100/50 text-center font-medium mt-3">
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
