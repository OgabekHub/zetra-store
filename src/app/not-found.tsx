import Link from 'next/link';

/**
 * 404 chegarasi. Avval umuman yo'q edi, holbuki `notFound()` ikkita marshrutda
 * chaqiriladi — foydalanuvchi Next ning standart, brendsiz sahifasiga tushardi.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-brand-dark light:bg-slate-50">
      <div className="text-center max-w-md space-y-6">
        <p className="text-7xl font-black text-indigo-400 light:text-indigo-600">404</p>
        <h1 className="text-2xl font-bold text-white light:text-slate-900">
          Sahifa topilmadi
        </h1>
        <p className="text-slate-400 light:text-slate-500 text-sm leading-relaxed">
          Siz qidirgan sahifa o&apos;chirilgan yoki manzil noto&apos;g&apos;ri kiritilgan
          bo&apos;lishi mumkin.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-colors"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    </main>
  );
}
