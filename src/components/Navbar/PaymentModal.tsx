"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, CreditCard, Smartphone, Lock, ShieldCheck, ArrowLeft, ArrowRight, Clock, Receipt } from 'lucide-react';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';

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
      toast.error("Karta raqami xato kiritildi!");
      return;
    }
    if ((method === 'payme' || method === 'click') && !phoneNumber) {
      toast.error("Telefon raqami kiritilishi shart!");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate gateway request
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('sms');
      setSmsCountdown(60);
      toast.success("SMS tasdiqlash kodi telefoningizga yuborildi!");
    }, 1500);
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode || smsCode.length < 4) {
      toast.error("SMS kodni to'liq kiriting!");
      return;
    }

    setIsSubmitting(true);

    // Simulate OTP validation
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
      toast.success("To'lov muvaffaqiyatli amalga oshirildi!", { icon: '🎉' });
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
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {step !== 'select' && step !== 'success' && (
              <button 
                onClick={handleGoBack}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-lg font-bold text-white">
              {step === 'select' && "To'lov tizimini tanlang"}
              {step === 'form' && `${method?.toUpperCase()} to'lov oynasi`}
              {step === 'sms' && "SMS tasdiqlash"}
              {step === 'success' && "To'lov muvaffaqiyatli o'tdi"}
            </h3>
          </div>
          {step !== 'success' && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
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
              <div className="bg-slate-850/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 font-medium">To'lov miqdori:</p>
                  <p className="text-xl font-extrabold text-white mt-1">{totalAmountFormatted}</p>
                </div>
                <Receipt className="w-8 h-8 text-indigo-400/80" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Uzum Bank Button */}
                <button
                  onClick={() => handleSelectMethod('uzum')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/10 to-indigo-950/20 hover:from-purple-900/20 hover:to-indigo-950/30 border border-purple-800/20 hover:border-purple-500/50 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-purple-650/20">
                      U
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Uzum Bank</p>
                      <p className="text-xs text-slate-400 mt-0.5">Karta raqami orqali oson to'lov</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
                </button>

                {/* Payme Button */}
                <button
                  onClick={() => handleSelectMethod('payme')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-teal-950/10 to-emerald-950/10 hover:from-teal-950/20 hover:to-emerald-950/20 border border-teal-800/20 hover:border-teal-500/50 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-teal-505 bg-[#3cd2c4] flex items-center justify-center text-slate-900 font-extrabold text-lg shadow-lg shadow-teal-500/20">
                      P
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Payme</p>
                      <p className="text-xs text-slate-400 mt-0.5">Telefon raqami yoki Payme ID</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
                </button>

                {/* Click Button */}
                <button
                  onClick={() => handleSelectMethod('click')}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/10 to-sky-950/10 hover:from-blue-900/20 hover:to-sky-950/20 border border-blue-800/20 hover:border-blue-500/50 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.99] h-20 overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-650/20">
                      C
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Click Evolution</p>
                      <p className="text-xs text-slate-400 mt-0.5">Tezkor to'lov havolasi va click-pin</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors relative z-10" />
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                </button>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-850/20 border border-slate-800 p-4 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-normal">
                  Zetra barcha to'lovlarni SSL xavfsiz kanallar orqali shifrlaydi. Karta ma'lumotlaringiz hech qachon saqlanmaydi va uchinchi shaxslarga berilmaydi.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT DETAILS FORM */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-slate-850/40 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">Summa:</span>
                <span className="text-sm font-extrabold text-white">{totalAmountFormatted}</span>
              </div>

              {method === 'uzum' ? (
                // Uzum Bank: Card Input
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Karta raqami (Uzcard / Humo)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <CreditCard className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                        onChange={handleCardNumberChange}
                        className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all"
                        placeholder="8600 0000 0000 0000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Muddati
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-center transition-all"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Karta kodi (SMS)
                      </label>
                      <div className="block w-full py-3 border border-slate-800/50 rounded-2xl bg-slate-950/20 text-slate-500 text-xs text-center font-medium">
                        SMS orqali yuboriladi
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Payme & Click: Phone input
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Telefon raqami
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Smartphone className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={`block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 text-sm transition-all ${
                          method === 'payme' ? 'focus:ring-teal-500/50 focus:border-teal-500' : 'focus:ring-blue-500/50 focus:border-blue-500'
                        }`}
                        placeholder="998 (90) 000-00-00"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Telefoningizga bog'langan {method === 'payme' ? 'Payme' : 'Click'} hisobingizdan to'lovni tasdiqlash uchun hisob-faktura yuboramiz.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] text-sm cursor-pointer flex items-center justify-center gap-2 ${
                  isSubmitting 
                    ? 'bg-slate-800 text-slate-500 pointer-events-none' 
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
                    Aloqa o'rnatilmoqda...
                  </>
                ) : (
                  <>
                    Davom etish
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
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400">Tasdiqlash kodi telefoningizga yuborildi</p>
                <p className="text-[10px] text-slate-550">Kodni quyidagi maydonga kiriting (Demo uchun xohlagan 4 ta raqam)</p>
              </div>

              <div className="max-w-[200px] mx-auto">
                <input
                  type="text"
                  maxLength={4}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full py-3.5 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-lg tracking-[1.5em] text-center font-bold"
                  placeholder="0000"
                  required
                />
              </div>

              <div className="text-center">
                {smsCountdown > 0 ? (
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Kodni qayta yuborish: {smsCountdown} soniya
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSmsCountdown(60);
                      toast.success("SMS kod qayta yuborildi!");
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Kodni qayta yuborish
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
                    Kodni tekshirish...
                  </>
                ) : (
                  "To'lovni tasdiqlash"
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 'success' && (
            <div className="text-center space-y-6 animate-scale-up py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-450 mx-auto scale-110">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-white">To'lov muvaffaqiyatli o'tdi!</h4>
                <p className="text-xs text-slate-400 mt-1">Rahmat! Buyurtmangiz tasdiqlandi.</p>
              </div>

              {/* Receipt invoice details */}
              <div className="bg-slate-850/30 border border-slate-800 rounded-3xl p-5 text-left text-xs space-y-3 relative overflow-hidden">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kvitansiya ID:</span>
                  <span className="font-semibold text-slate-200">{invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sana:</span>
                  <span className="font-semibold text-slate-200">
                    {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">To'lov uslubi:</span>
                  <span className="font-semibold text-slate-200 uppercase">{method}</span>
                </div>
                
                <div className="border-t border-slate-800 my-2 pt-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Sotib olingan mahsulotlar</span>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span className="truncate max-w-[200px]">{item.title}</span>
                        <span>{formatPrice(item.price * item.quantity, currency, exchangeRate)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-extrabold text-white">
                  <span>Jami to'langan summa:</span>
                  <span className="text-emerald-450">{totalAmountFormatted}</span>
                </div>
                
                {/* Watermark security note */}
                <div className="text-[9px] text-indigo-400 bg-indigo-500/5 p-2 rounded-lg border border-indigo-550/10 text-center font-medium mt-3">
                  🔒 Mahsulotlar xavfsiz yuklab olish uchun shifrlash tizimiga ulandi.
                </div>
              </div>

              <button
                onClick={handleFinishPayment}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
              >
                Mening xaridlarimga o'tish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
