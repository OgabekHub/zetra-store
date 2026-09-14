/**
 * Kategoriya nomi → tarjima key mapping
 * Avval CartDrawer, MainContent, SellerDashboard da alohida-alohida bor edi.
 * Endi bitta manba.
 */
export const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  'Dizayn Shablonlari': 'cat_design',
  '3D Modellar': 'cat_3d',
  'E-Kitoblar': 'cat_ebooks',
  'Dastur Kodelari': 'cat_code',
  'Grafika & Media': 'cat_graphics',
  "O'yin va Hisoblar": 'cat_games',
  'Litsenziya & Kalitlar': 'cat_keys',
  'Audio & Musiqa': 'cat_audio',
};

/** Barcha mavjud kategoriya nomlari (Carousel uchun) */
export const ALL_CATEGORIES = Object.keys(CATEGORY_TRANSLATION_KEYS);

/**
 * Kategoriya nomini t() funksiyasi orqali tarjima qilish uchun yordamchi.
 * @param catName  — mahsulot.category (o'zbek nomi)
 * @param t        — useLanguage() dan olingan tarjima funksiyasi
 */
export const getCategoryLabel = (
  catName: string,
  t: (key: string) => string
): string => {
  const key = CATEGORY_TRANSLATION_KEYS[catName];
  return key ? t(key) : catName;
};

/**
 * Kategoriya nomi -> URL slug.
 *
 * Avval slug regex bilan hosil qilinardi va apostrofni saqlab qolardi:
 * "O'yin va Hisoblar" -> `o'yin-va-hisoblar`. Bu xom apostrof sitemap ichiga
 * shundayligicha tushardi, `next/link` esa navigatsiyada uni `%27` ga
 * kodlardi — natijada bitta sahifaga ikkita turli URL ishora qilardi.
 * Endi slug qo'lda yozilgan, shuning uchun URL kritik yo'lida regex yo'q.
 */
export const CATEGORY_SLUGS: Record<string, string> = {
  'Dizayn Shablonlari': 'dizayn-shablonlari',
  '3D Modellar': '3d-modellar',
  'E-Kitoblar': 'e-kitoblar',
  'Dastur Kodelari': 'dastur-kodelari',
  'Grafika & Media': 'grafika-media',
  "O'yin va Hisoblar": 'oyin-va-hisoblar',
  'Litsenziya & Kalitlar': 'litsenziya-kalitlar',
  'Audio & Musiqa': 'audio-musiqa',
};

export const categoryToSlug = (catName: string): string =>
  CATEGORY_SLUGS[catName] ??
  catName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** URL slug'dan kategoriya nomini topish. */
export const slugToCategory = (slug: string): string | undefined =>
  ALL_CATEGORIES.find((cat) => categoryToSlug(cat) === slug);
