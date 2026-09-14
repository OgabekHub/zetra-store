"use client";

import { useCallback, useEffect, useId, useRef } from 'react';

/**
 * Modal oynalar uchun umumiy xatti-harakat.
 *
 * Bu blok avval **olti** faylda deyarli baytma-bayt takrorlangan edi:
 * `ProductModal`, `CartDrawer`, `AuthModal`, `PaymentModal`,
 * `SellerDashboard`, `UserProfileModal` — jami ~112 qator.
 *
 * Takrorlash bilan birga uchta nuqson ham hamma joyda takrorlangan edi:
 *  1. Fokus tuzog'i yo'q edi — Tab bosganda fokus modaldan chiqib, orqadagi
 *     sahifaga o'tib ketardi.
 *  2. Yopilgandan keyin fokus tiklanmasdi — u `<body>` ga tushardi va Tab
 *     sahifaning boshidan qayta boshlanardi.
 *  3. Tashqi bosish `click` ga bog'langan edi. `click` esa `mousedown` va
 *     `mouseup` ning umumiy ajdodida ishlaydi, shuning uchun karta
 *     raqamidagi xatoni tanlab, panel chekkasidan tashqarida qo'yib
 *     yuborsangiz forma butunlay yo'qolardi.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Nechta modal ochiq — ichma-ich ochilganda scroll erta ochilib ketmasligi uchun. */
let openCount = 0;

/**
 * Ochiq modallar steki. ESC faqat eng ustki modalni yopadi — busiz ichma-ich
 * ochilgan oynalarda bitta ESC hammasini birdan yopardi.
 */
const openStack: object[] = [];

function lockScroll(): void {
  openCount += 1;
  if (openCount > 1) return;
  const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-w', `${scrollbarW}px`);
  document.body.classList.add('modal-open');
}

function unlockScroll(): void {
  openCount = Math.max(0, openCount - 1);
  if (openCount > 0) return;
  document.body.classList.remove('modal-open');
  document.documentElement.style.removeProperty('--scrollbar-w');
}

export interface ModalA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  /** `false` bo'lsa ESC va fon bosish yopmaydi. */
  dismissable?: boolean;
  /**
   * Ko'rinadigan sarlavhasi yo'q modallar uchun nom.
   * Berilmasa, `aria-labelledby` ishlatiladi va chaqiruvchi sarlavhaga
   * `id={titleId}` qo'yishi kerak.
   */
  label?: string;
}

export interface ModalA11y {
  /** Panel elementiga biriktiriladigan ref. */
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** `aria-labelledby` uchun sarlavha id si. */
  titleId: string;
  /** Fon elementiga tarqatiladigan proplar. */
  backdropProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
  };
  /** Panel elementiga tarqatiladigan proplar. */
  panelProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    role: 'dialog';
    'aria-modal': true;
    'aria-labelledby'?: string;
    'aria-label'?: string;
    tabIndex: -1;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

export function useModalA11y({
  isOpen,
  onClose,
  dismissable = true,
  label,
}: ModalA11yOptions): ModalA11y {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const pointerDownOutside = useRef(false);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const stackToken = useRef<object>({});

  // Ishlovchi har renderda yangi bo'ladi; effekt uni ref orqali o'qiydi,
  // shunda tinglovchi har renderda qayta bog'lanmaydi.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Scroll qulfi + fokusni saqlash va tiklash
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const token = stackToken.current;
    openStack.push(token);
    lockScroll();

    // Ochilganda fokus modal ichiga qo'yiladi.
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });

    return () => {
      const index = openStack.lastIndexOf(token);
      if (index !== -1) openStack.splice(index, 1);
      unlockScroll();
      previouslyFocused.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  // ESC
  useEffect(() => {
    if (!isOpen || !dismissable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openStack[openStack.length - 1] !== stackToken.current) return;
      closeRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismissable]);

  // Tab bilan fokusni modal ichida ushlab turish.
  // Ro'yxat har bosishda qaytadan yig'iladi: bu modallar butun bosqichlarni
  // almashtiradi, shuning uchun keshlangan ro'yxat darhol eskiradi.
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;

    const all = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.closest('[inert], [aria-hidden="true"]'),
    );
    // Ko'rinmaydigan elementlar tab tartibidan chiqariladi. Maket ma'lumoti
    // umuman yo'q muhitda (masalan, jsdom) hamma elementlar qoldiriladi.
    // `offsetParent` ishlatilmaydi: u `position: fixed` elementlar uchun ham
    // `null` qaytaradi.
    const visible = all.filter((el) => el.getClientRects().length > 0);
    const items = visible.length > 0 ? visible : all;
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    pointerDownOutside.current =
      !!panelRef.current && !panelRef.current.contains(e.target as Node);
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const outside =
        pointerDownOutside.current &&
        !!panelRef.current &&
        !panelRef.current.contains(e.target as Node);
      pointerDownOutside.current = false;
      if (outside && dismissable) closeRef.current();
    },
    [dismissable],
  );

  return {
    panelRef,
    titleId,
    backdropProps: { onMouseDown, onClick },
    panelProps: {
      ref: panelRef,
      role: 'dialog',
      'aria-modal': true,
      ...(label ? { 'aria-label': label } : { 'aria-labelledby': titleId }),
      tabIndex: -1,
      onKeyDown: handleKeyDown,
    },
  };
}
