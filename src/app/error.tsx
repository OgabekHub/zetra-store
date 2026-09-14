"use client";

import { useEffect } from 'react';

/**
 * Marshrut darajasidagi xato chegarasi.
 *
 * Next 16.3 dan boshlab qayta urinish propi barqaror `retry` (16.2 da
 * `unstable_retry` edi). `retry()` bola komponentlarni qayta so'rab, qayta
 * render qiladi. `reset()` faqat qayta so'rovsiz holatni tozalash kerak
 * bo'lganda ishlatiladi — bizda bunday holat yo'q.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('[zetra] marshrut xatosi:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-brand-dark light:bg-slate-50">
      <div className="text-center max-w-md space-y-6" role="alert">
        <h1 className="text-2xl font-bold text-white light:text-slate-900">
          Kutilmagan xatolik yuz berdi
        </h1>
        <p className="text-slate-400 light:text-slate-500 text-sm leading-relaxed">
          Sahifani yuklashda muammo chiqdi. Qayta urinib ko&apos;ring.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
        >
          Qayta urinish
        </button>
      </div>
    </main>
  );
}
