"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, MessageCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (name: string, email: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { language, t } = useLanguage();
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

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

  // Escape key handler
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error(language === 'uz' ? "Barcha maydonlarni to'ldiring!" : language === 'ru' ? "Ð—Ð°Ð¿Ð¾Ð»Ð½Ð¸Ñ‚Ðµ Ð²ÑÐµ Ð¿Ð¾Ð»Ñ!" : "Please fill out all fields!");
      return;
    }
    if (loginPassword.length < 6) {
      toast.error(language === 'uz' ? "Parol kamida 6 ta belgidan iborat bo'lishi kerak!" : language === 'ru' ? "ÐŸÐ°Ñ€Ð¾Ð»ÑŒ Ð´Ð¾Ð»Ð¶ÐµÐ½ ÑÐ¾ÑÑ‚Ð¾ÑÑ‚ÑŒ Ð¼Ð¸Ð½Ð¸Ð¼ÑƒÐ¼ Ð¸Ð· 6 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð¾Ð²!" : "Password must be at least 6 characters long!");
      return;
    }
    
    // Simulate successful login
    // Extract first part of email as fallback name if email doesn't match standard
    const name = loginEmail.split('@')[0];
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    onLoginSuccess(capitalizedName, loginEmail);
    toast.success(
      language === 'uz' 
        ? `Xush kelibsiz, ${capitalizedName}!` 
        : language === 'ru' 
          ? `Ð”Ð¾Ð±Ñ€Ð¾ Ð¿Ð¾Ð¶Ð°Ð»Ð¾Ð²Ð°Ñ‚ÑŒ, ${capitalizedName}!` 
          : `Welcome, ${capitalizedName}!`, 
      { icon: 'ðŸ‘‹' }
    );
    onClose();
    
    // Clear inputs
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.error(language === 'uz' ? "Barcha maydonlarni to'ldiring!" : language === 'ru' ? "Ð—Ð°Ð¿Ð¾Ð»Ð½Ð¸Ñ‚Ðµ Ð²ÑÐµ Ð¿Ð¾Ð»Ñ!" : "Please fill out all fields!");
      return;
    }
    if (registerPassword.length < 6) {
      toast.error(language === 'uz' ? "Parol kamida 6 ta belgidan iborat bo'lishi kerak!" : language === 'ru' ? "ÐŸÐ°Ñ€Ð¾Ð»ÑŒ Ð´Ð¾Ð»Ð¶ÐµÐ½ ÑÐ¾ÑÑ‚Ð¾ÑÑ‚ÑŒ Ð¼Ð¸Ð½Ð¸Ð¼ÑƒÐ¼ Ð¸Ð· 6 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð¾Ð²!" : "Password must be at least 6 characters long!");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error(language === 'uz' ? "Parollar mos kelmadi!" : language === 'ru' ? "ÐŸÐ°Ñ€Ð¾Ð»Ð¸ Ð½Ðµ ÑÐ¾Ð²Ð¿Ð°Ð´Ð°ÑŽÑ‚!" : "Passwords do not match!");
      return;
    }

    // Simulate successful registration
    onLoginSuccess(registerName, registerEmail);
    toast.success(
      language === 'uz' 
        ? `Ro'yxatdan muvaffaqiyatli o'tdingiz, ${registerName}!` 
        : language === 'ru' 
          ? `Ð’Ñ‹ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ Ð·Ð°Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€Ð¾Ð²Ð°Ð»Ð¸ÑÑŒ, ${registerName}!` 
          : `Successfully registered, ${registerName}!`, 
      { icon: 'ðŸŽ‰' }
    );
    onClose();

    // Clear inputs
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
  };

  // Mock social login handler
  const handleSocialLogin = (platform: string) => {
    const demoNames: Record<string, string> = {
      Google: 'Og\'abek Olimjonov',
      Telegram: 'Og\'abek (Telegram)',
      GitHub: 'ogabek_dev'
    };
    onLoginSuccess(demoNames[platform], `demo_${platform.toLowerCase()}@zetra.uz`);
    toast.success(
      language === 'uz' 
        ? `${platform} orqali muvaffaqiyatli kirildi!` 
        : language === 'ru' 
          ? `Ð£ÑÐ¿ÐµÑˆÐ½Ñ‹Ð¹ Ð²Ñ…Ð¾Ð´ Ñ‡ÐµÑ€ÐµÐ· ${platform}!` 
          : `Successfully logged in via ${platform}!`, 
      { icon: 'ðŸš€' }
    );
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 light:bg-slate-50 light:border-slate-200 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 light:text-indigo-600" />
            <span className="text-white light:text-slate-900 font-bold text-lg">Zetra Store</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white light:bg-slate-100 hover:light:bg-slate-200 light:text-slate-500 hover:light:text-slate-800 transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 mt-6 flex border-b border-slate-800 light:border-slate-200">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'login' 
                ? 'text-indigo-400 light:text-indigo-600' 
                : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
            }`}
          >
            {t('nav_login')}
            {activeTab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 light:bg-indigo-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'register' 
                ? 'text-indigo-400 light:text-indigo-600' 
                : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
            }`}
          >
            {t('auth_sign_up_btn')}
            {activeTab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 light:bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Form Body - Scrollable if content exceeds modal max-height */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                  {t('auth_email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder="example@zetra.uz"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider">
                    {t('auth_password')}
                  </label>
                  <button 
                    type="button"
                    onClick={() => toast(
                      language === 'uz' 
                        ? 'Parolni tiklash havolasi elektron pochtangizga yuborildi!' 
                        : language === 'ru' 
                          ? 'Ð¡ÑÑ‹Ð»ÐºÐ° Ð´Ð»Ñ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ Ð¿Ð°Ñ€Ð¾Ð»Ñ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð° Ð½Ð° Ð²Ð°ÑˆÑƒ Ð¿Ð¾Ñ‡Ñ‚Ñƒ!' 
                          : 'Password reset link has been sent to your email!', 
                      { icon: 'ðŸ“©' }
                    )}
                    className="text-xs text-indigo-400 light:text-indigo-600 hover:text-indigo-300 hover:light:text-indigo-500 font-medium transition-colors cursor-pointer"
                  >
                    {language === 'uz' ? 'Parolni unutdingizmi?' : language === 'ru' ? 'Ð—Ð°Ð±Ñ‹Ð»Ð¸ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-600 bg-slate-950/40 light:bg-white border-slate-800 light:border-slate-300 rounded-md focus:ring-indigo-500 focus:ring-offset-slate-900 light:focus:ring-offset-white focus:ring-2 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-slate-400 light:text-slate-600 select-none cursor-pointer">
                  {language === 'uz' ? 'Meni eslab qol' : language === 'ru' ? 'Ð—Ð°Ð¿Ð¾Ð¼Ð½Ð¸Ñ‚ÑŒ Ð¼ÐµÐ½Ñ' : 'Remember me'}
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-98 text-sm cursor-pointer"
              >
                {t('auth_sign_in_btn')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                  {t('auth_name')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder={language === 'uz' ? 'Ismingizni kiriting' : language === 'ru' ? 'Ð’Ð²ÐµÐ´Ð¸Ñ‚Ðµ Ð²Ð°ÑˆÐµ Ð¸Ð¼Ñ' : 'Enter your name'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                  {t('auth_email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder="example@zetra.uz"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                  {language === 'uz' ? 'Parol yaratish' : language === 'ru' ? 'Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ' : 'Create password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder={language === 'uz' ? 'Kamida 6 ta belgi' : language === 'ru' ? 'ÐœÐ¸Ð½Ð¸Ð¼ÑƒÐ¼ 6 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð¾Ð²' : 'At least 6 characters'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                  {t('auth_confirm_password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                    placeholder={language === 'uz' ? 'Parolni qayta kiriting' : language === 'ru' ? 'ÐŸÐ¾Ð²Ñ‚Ð¾Ñ€Ð¸Ñ‚Ðµ Ð²Ð²Ð¾Ð´ Ð¿Ð°Ñ€Ð¾Ð»Ñ' : 'Confirm password'}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-98 text-sm cursor-pointer"
              >
                {t('auth_sign_up_btn')}
              </button>
            </form>
          )}

          {/* Social Logins */}
          <div className="mt-8">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800 light:border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 light:text-slate-400 uppercase tracking-wider bg-transparent">
                {language === 'uz' ? 'Yoki quyidagilar orqali' : language === 'ru' ? 'Ð˜Ð»Ð¸ Ð²Ð¾Ð¹Ñ‚Ð¸ Ñ‡ÐµÑ€ÐµÐ·' : 'Or sign in with'}
              </span>
              <div className="flex-grow border-t border-slate-800 light:border-slate-200"></div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                className="flex items-center justify-center py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white light:bg-slate-100 hover:light:bg-slate-200/80 light:border-slate-200 light:text-slate-700 hover:light:text-slate-900 rounded-xl transition-all text-xs font-medium cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('Telegram')}
                className="flex items-center justify-center py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white light:bg-slate-100 hover:light:bg-slate-200/80 light:border-slate-200 light:text-slate-700 hover:light:text-slate-900 rounded-xl transition-all text-xs font-medium cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" fill="#24A1DE" />
                </svg>
                Telegram
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('GitHub')}
                className="flex items-center justify-center py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white light:bg-slate-100 hover:light:bg-slate-200/80 light:border-slate-200 light:text-slate-700 hover:light:text-slate-900 rounded-xl transition-all text-xs font-medium cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" className="fill-current text-white light:text-slate-800" />
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
