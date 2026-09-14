"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Mail, Lock, User, Sparkles, Smartphone } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import { useModalA11y } from '@/hooks/useModalA11y';
import { useTheme } from '@/context/ThemeContext';
import { logSecurityEvent, createSession } from '@/store/securityStore';
import { commitRegistration, findAccountByEmail, verifyCredentials } from '@/store/accountsStore';
import { getLoginStatus, recordLoginFailure, recordLoginSuccess } from '@/store/loginThrottleStore';
import { hashPassword } from '@/lib/password';
import {
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN_MS,
  canResendOtp,
  createOtpChallenge,
  verifyOtp,
  type OtpChallenge,
} from '@/lib/otp';
import { isValidEmail, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/utils/validation';
import type { PasswordHash } from '@/types';
import zetraLogoDark from '../../assets/images/zetra-logo-dark.png';
import zetraLogoLight from '../../assets/images/zetra-logo-light.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (name: string, email: string) => void;
}

type AuthTab = 'login' | 'register';

interface PendingUser {
  name: string;
  email: string;
  isRegister: boolean;
  /** Ro'yxatdan o'tishda parol OTP dan oldin xeshlanadi; ochiq parol saqlanmaydi. */
  passwordHash?: PasswordHash;
}

const RESEND_SECONDS = Math.round(OTP_RESEND_COOLDOWN_MS / 1000);
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 80;

const LABEL_CLASS = 'block text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider';
const ICON_CLASS =
  'absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 light:text-slate-400';
const INPUT_CLASS =
  'block w-full pl-11 pr-3 py-3 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all';
const PRIMARY_BUTTON_CLASS =
  'w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-98 text-sm cursor-pointer';
const SOCIAL_BUTTON_CLASS =
  'flex items-center justify-center py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white light:bg-slate-100 hover:light:bg-slate-200/80 light:border-slate-200 light:text-slate-700 hover:light:text-slate-900 rounded-xl transition-all text-xs font-medium cursor-pointer';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: React.ReactNode;
  labelAction?: React.ReactNode;
}

/** Label har doim `htmlFor` orqali maydonga bog'lanadi. Avval birorta maydonda bu yo'q edi. */
function TextField({ id, label, icon, labelAction, ...inputProps }: TextFieldProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <div className={ICON_CLASS} aria-hidden="true">
          {icon}
        </div>
        <input id={id} className={INPUT_CLASS} {...inputProps} />
      </div>
    </div>
  );
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const { t } = useLanguage();
  const { theme } = useTheme();
  const zetraLogo = theme === 'dark' ? zetraLogoDark : zetraLogoLight;
  const fieldId = useId();

  const [step, setStep] = useState<'form' | 'otp' | 'social_loading'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);
  const [socialPlatform, setSocialPlatform] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [demoCode, setDemoCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tasdiqlash kodi faqat komponent xotirasida turadi, localStorage ga
  // yozilmaydi. Avval u barcha foydalanuvchilar uchun qat'iy "1998" edi.
  const otpChallenge = useRef<OtpChallenge | null>(null);

  // Ijtimoiy kirish taymeri ref'da: modal yopilsa u bekor qilinadi. Avval
  // modalni yopsangiz ham 1.5 soniyadan keyin tizimga kirib qolardingiz.
  const socialTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (socialTimer.current !== null) clearTimeout(socialTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const { backdropProps, panelProps } = useModalA11y({
    isOpen,
    onClose,
    label: t('nav_login'),
  });

  if (!isOpen) return null;

  const tabId = (tab: AuthTab) => `${fieldId}-tab-${tab}`;
  const panelId = `${fieldId}-panel`;

  const resetFlow = () => {
    otpChallenge.current = null;
    setStep('form');
    setPendingUser(null);
    setOtpCode('');
    setDemoCode('');
    setLoginEmail('');
    setLoginPassword('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
  };

  const minutesLabel = (ms: number) => `${Math.max(1, Math.ceil(ms / 60_000))} ${t('auth_minutes')}`;

  const startOtp = (user: PendingUser) => {
    const challenge = createOtpChallenge();
    otpChallenge.current = challenge;
    setPendingUser(user);
    setDemoCode(challenge.code);
    setOtpCode('');
    setCountdown(RESEND_SECONDS);
    setStep('otp');
    // SMS provayder yo'q: kod demo sifatida ochiq ko'rsatiladi.
    toast.success(`${t('auth_otp_sent')} (${t('auth_demo_code')}: ${challenge.code})`, { duration: 6000 });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      toast.error(t('auth_please_fill_out_all_fields'));
      return;
    }
    if (!isValidEmail(email)) {
      toast.error(t('auth_email_invalid'));
      return;
    }

    const status = getLoginStatus(email);
    if (!status.allowed) {
      toast.error(`${t('auth_login_locked')} (${minutesLabel(status.retryAfterMs)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Juda uzun parol xeshlanmaydi — bu brauzerni qotirish yo'li bo'lardi.
      const result =
        loginPassword.length > MAX_PASSWORD_LENGTH
          ? ({ ok: false } as const)
          : await verifyCredentials(email, loginPassword);

      if (!result.ok) {
        const outcome = recordLoginFailure(email);
        logSecurityEvent(
          email,
          t(outcome.locked ? 'log_login_locked' : 'log_login_failed'),
          outcome.locked ? 'warning' : 'failed',
        );
        // Email ro'yxatdan o'tganmi yoki parol xatomi — oshkor qilinmaydi.
        toast.error(
          outcome.locked
            ? `${t('auth_login_locked')} (${minutesLabel(outcome.retryAfterMs)})`
            : t('auth_invalid_credentials'),
        );
        return;
      }

      recordLoginSuccess(email);
      setLoginPassword('');
      logSecurityEvent(result.account.email, t('log_login_otp_sent'), 'warning');
      startOtp({ name: result.account.name, email: result.account.email, isRegister: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const name = registerName.trim();
    const email = registerEmail.trim();
    if (!name || !email || !registerPassword || !registerConfirmPassword) {
      toast.error(t('auth_please_fill_out_all_fields'));
      return;
    }
    if (!isValidEmail(email)) {
      toast.error(t('auth_email_invalid'));
      return;
    }
    if (registerPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(t('auth_password_min_length'));
      return;
    }
    if (registerPassword.length > MAX_PASSWORD_LENGTH) {
      toast.error(t('auth_password_too_long'));
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error(t('auth_passwords_do_not_match'));
      return;
    }
    if (findAccountByEmail(email)?.password) {
      toast.error(t('auth_email_taken'));
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordHash = await hashPassword(registerPassword);
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      logSecurityEvent(email, t('log_register_otp_sent'), 'warning');
      startOtp({ name, email, isRegister: true, passwordHash });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const challenge = otpChallenge.current;
    if (!pendingUser || !challenge) {
      resetFlow();
      return;
    }

    const { result, challenge: updated } = verifyOtp(challenge, otpCode);
    otpChallenge.current = updated;

    if (!result.ok) {
      if (result.reason === 'malformed') {
        toast.error(t('auth_please_enter_the_complete_otp_code'));
      } else if (result.reason === 'expired') {
        toast.error(t('auth_otp_expired'));
      } else if (result.reason === 'locked') {
        logSecurityEvent(pendingUser.email, t('log_otp_failed'), 'failed');
        toast.error(t('auth_otp_locked'));
        resetFlow();
      } else {
        logSecurityEvent(pendingUser.email, t('log_otp_failed'), 'failed');
        toast.error(`${t('auth_invalid_verification_code')} (${t('auth_attempts_left')}: ${result.attemptsLeft})`);
        setOtpCode('');
      }
      return;
    }

    if (pendingUser.isRegister) {
      if (!pendingUser.passwordHash) {
        resetFlow();
        return;
      }
      const registration = commitRegistration(pendingUser.name, pendingUser.email, pendingUser.passwordHash);
      if (!registration.ok) {
        toast.error(t('auth_email_taken'));
        resetFlow();
        return;
      }
    }

    logSecurityEvent(
      pendingUser.email,
      t(pendingUser.isRegister ? 'log_register_success' : 'log_login_success'),
      'success',
    );
    createSession(pendingUser.email);
    onLoginSuccess(pendingUser.name, pendingUser.email);
    toast.success(`${t('auth_welcome')}, ${pendingUser.name}!`, { icon: '👋' });
    resetFlow();
    onClose();
  };

  const handleResendOtp = () => {
    if (!pendingUser || !canResendOtp(otpChallenge.current)) return;
    logSecurityEvent(pendingUser.email, t('log_otp_resent'), 'warning');
    startOtp(pendingUser);
  };

  const handleCancelOtp = () => {
    if (pendingUser) logSecurityEvent(pendingUser.email, t('log_otp_cancelled'), 'warning');
    otpChallenge.current = null;
    setPendingUser(null);
    setDemoCode('');
    setOtpCode('');
    setStep('form');
  };

  const handleSocialLogin = (platform: string) => {
    setStep('social_loading');
    setSocialPlatform(platform);

    socialTimer.current = setTimeout(() => {
      const demoNames: Record<string, string> = {
        Google: "Og'abek Olimjonov",
        Telegram: "Og'abek (Telegram)",
        GitHub: 'ogabek_dev',
      };
      const name = demoNames[platform];
      const email = `demo_${platform.toLowerCase()}@zetra.uz`;

      logSecurityEvent(email, `${t('log_social_login')} (${platform})`, 'success');
      createSession(email);
      onLoginSuccess(name, email);
      toast.success(`${t('auth_social_success')}: ${platform}`, { icon: '🚀' });
      onClose();
      setStep('form');
    }, 1500);
  };

  /** WAI-ARIA tab naqshi: chap/o'ng o'qlar, Home va End tugmalari. */
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let next: AuthTab;
    if (e.key === 'Home') next = 'login';
    else if (e.key === 'End') next = 'register';
    else next = activeTab === 'login' ? 'register' : 'login';
    setActiveTab(next);
    document.getElementById(tabId(next))?.focus();
  };

  const tabs: { id: AuthTab; label: string }[] = [
    { id: 'login', label: t('nav_login') },
    { id: 'register', label: t('auth_sign_up_btn') },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div
        {...panelProps}
        className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 light:bg-slate-50 light:border-slate-200 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 pb-0 flex justify-between items-center">
          <div className="flex items-center">
            <Image src={zetraLogo} alt="Zetra" sizes="120px" className="h-10 w-auto object-contain" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white light:bg-slate-100 hover:light:bg-slate-200 light:text-slate-500 hover:light:text-slate-800 transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        {step === 'form' && (
          <div
            role="tablist"
            aria-label={t('nav_login')}
            className="px-6 mt-6 flex border-b border-slate-800 light:border-slate-200"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={tabId(tab.id)}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={handleTabKeyDown}
                  className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                    selected
                      ? 'text-indigo-400 light:text-indigo-600'
                      : 'text-slate-400 hover:text-slate-200 light:text-slate-500 hover:light:text-slate-800'
                  }`}
                >
                  {tab.label}
                  {selected && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 light:bg-indigo-600 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          {step === 'social_loading' && (
            <div
              className="p-8 text-center space-y-6 py-16 animate-fade-in flex flex-col items-center"
              role="status"
              aria-live="polite"
            >
              <div className="relative" aria-hidden="true">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin flex items-center justify-center" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white light:text-slate-900">{t('auth_social_popup_title')}</h4>
                <p className="text-xs text-slate-400 light:text-slate-500 max-w-xs">
                  {socialPlatform} - {t('auth_social_popup_desc')}
                </p>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div className="p-4 space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div
                  className="w-12 h-12 bg-indigo-500/10 light:bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 light:text-indigo-600 mx-auto border border-indigo-500/20 light:border-indigo-200"
                  aria-hidden="true"
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white light:text-slate-900">{t('auth_2fa_title')}</h4>
                <p className="text-xs text-slate-400 light:text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {t('auth_2fa_subtitle')}
                </p>
                {demoCode && (
                  <span className="inline-block text-[10px] bg-slate-950/40 text-slate-400 light:bg-slate-100/50 light:text-slate-500 px-2.5 py-0.5 rounded-md font-mono mt-1 select-all">
                    {t('auth_demo_code')}: {demoCode}
                  </span>
                )}
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="max-w-[200px] mx-auto">
                  <label htmlFor={`${fieldId}-otp`} className="sr-only">
                    {t('auth_2fa_title')}
                  </label>
                  <input
                    id={`${fieldId}-otp`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={OTP_LENGTH}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                    className="block w-full py-3.5 border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-950/40 light:bg-white text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-lg tracking-[1.5em] text-center font-bold"
                    placeholder={'0'.repeat(OTP_LENGTH)}
                    required
                    autoFocus
                  />
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-slate-500 light:text-slate-450">
                      {t('pay_sms_countdown')}: {countdown} {t('pay_sms_seconds')}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-xs text-indigo-400 light:text-indigo-600 hover:text-indigo-300 hover:light:text-indigo-500 font-semibold cursor-pointer"
                    >
                      {t('auth_2fa_resend')}
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancelOtp}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-800/80 border border-slate-800 light:bg-slate-100 hover:light:bg-slate-200 light:border-slate-200 text-slate-300 light:text-slate-700 rounded-2xl font-bold transition-all text-sm cursor-pointer"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm cursor-pointer"
                  >
                    {t('auth_2fa_verify')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'form' && (
            <div role="tabpanel" id={panelId} aria-labelledby={tabId(activeTab)}>
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4" aria-busy={isSubmitting}>
                  <TextField
                    id={`${fieldId}-login-email`}
                    label={t('auth_email')}
                    icon={<Mail className="w-5 h-5" />}
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@zetra.uz"
                    autoComplete="email"
                    maxLength={MAX_EMAIL_LENGTH}
                    required
                  />

                  <TextField
                    id={`${fieldId}-login-password`}
                    label={t('auth_password')}
                    icon={<Lock className="w-5 h-5" />}
                    labelAction={
                      <button
                        type="button"
                        onClick={() => toast(t('auth_password_reset_demo'), { icon: 'ℹ️' })}
                        className="text-xs text-indigo-400 light:text-indigo-600 hover:text-indigo-300 hover:light:text-indigo-500 font-medium transition-colors cursor-pointer"
                      >
                        {t('auth_forgot_password')}
                      </button>
                    }
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    maxLength={MAX_PASSWORD_LENGTH}
                    required
                  />

                  <button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON_CLASS}>
                    {t('auth_sign_in_btn')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4" aria-busy={isSubmitting}>
                  <TextField
                    id={`${fieldId}-register-name`}
                    label={t('auth_name')}
                    icon={<User className="w-5 h-5" />}
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder={t('profile_name_placeholder')}
                    autoComplete="name"
                    maxLength={MAX_NAME_LENGTH}
                    required
                  />

                  <TextField
                    id={`${fieldId}-register-email`}
                    label={t('auth_email')}
                    icon={<Mail className="w-5 h-5" />}
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="example@zetra.uz"
                    autoComplete="email"
                    maxLength={MAX_EMAIL_LENGTH}
                    required
                  />

                  <TextField
                    id={`${fieldId}-register-password`}
                    label={t('auth_create_password')}
                    icon={<Lock className="w-5 h-5" />}
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder={t('auth_password_min_placeholder')}
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={MAX_PASSWORD_LENGTH}
                    required
                  />

                  <TextField
                    id={`${fieldId}-register-confirm`}
                    label={t('auth_confirm_password')}
                    icon={<Lock className="w-5 h-5" />}
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder={t('auth_confirm_password_2')}
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={MAX_PASSWORD_LENGTH}
                    required
                  />

                  <button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON_CLASS}>
                    {t('auth_sign_up_btn')}
                  </button>
                </form>
              )}

              {/* Social Logins */}
              <div className="mt-8">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800 light:border-slate-200" aria-hidden="true" />
                  <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 light:text-slate-450 uppercase tracking-wider bg-transparent">
                    {t('auth_or_sign_in_with')}
                  </span>
                  <div className="flex-grow border-t border-slate-800 light:border-slate-200" aria-hidden="true" />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <button type="button" onClick={() => handleSocialLogin('Google')} className={SOCIAL_BUTTON_CLASS}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button type="button" onClick={() => handleSocialLogin('Telegram')} className={SOCIAL_BUTTON_CLASS}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" fill="#24A1DE" />
                    </svg>
                    Telegram
                  </button>
                  <button type="button" onClick={() => handleSocialLogin('GitHub')} className={SOCIAL_BUTTON_CLASS}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" className="fill-current text-white light:text-slate-800" />
                    </svg>
                    GitHub
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
