import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const STORAGE_MESSAGE =
  "localStorage/sessionStorage ga to'g'ridan-to'g'ri murojaat taqiqlangan: @/store/createPersistentStore yoki @/store/storage orqali ishlating (xavfsiz o'qish, sxema tekshiruvi, kvota ishlovi).";
const I18N_MESSAGE =
  "Inline tarjima taqiqlangan: t('kalit') ishlating. Sana/son formatlash uchun LOCALE_TAG (@/utils/locale).";

/**
 * Loyiha qoidalari. Har biri loyihada haqiqatan topilgan xatoning qaytishini
 * to'xtatadi:
 *  - 224 ta `language === 'uz'` tekshiruvi tarjima tizimini chetlab o'tgan va
 *    ba'zilari bir tilni jimgina tashlab ketgan edi;
 *  - 10 ta himoyalanmagan `JSON.parse(localStorage...)` bitta buzilgan qiymat
 *    bilan butun daraxtni yiqitardi;
 *  - modal va formalarda klaviatura bilan erishib bo'lmaydigan boshqaruvlar va
 *    label'siz maydonlar bor edi.
 */
const restrictedSyntax = [
  {
    selector:
      "BinaryExpression[operator=/^[!=]==?$/][left.type='Identifier'][left.name='language'][right.type='Literal'][right.value=/^(uz|ru|en)$/]",
    message: I18N_MESSAGE,
  },
  {
    selector:
      "BinaryExpression[operator=/^[!=]==?$/][right.type='Identifier'][right.name='language'][left.type='Literal'][left.value=/^(uz|ru|en)$/]",
    message: I18N_MESSAGE,
  },
  {
    selector: "MemberExpression[object.type='Identifier'][object.name=/^(localStorage|sessionStorage)$/]",
    message: STORAGE_MESSAGE,
  },
  {
    selector:
      "MemberExpression[object.type='MemberExpression'][object.object.name='window'][object.property.name=/^(localStorage|sessionStorage)$/]",
    message: STORAGE_MESSAGE,
  },
  {
    selector: "AssignmentExpression[left.type='MemberExpression'][left.property.name=/^(innerHTML|outerHTML)$/]",
    message: "innerHTML/outerHTML ga yozish taqiqlangan (XSS xavfi). JSX ishlating.",
  },
  {
    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
    message: "insertAdjacentHTML taqiqlangan (XSS xavfi). JSX ishlating.",
  },
  {
    selector: "CallExpression[callee.object.name='document'][callee.property.name='write']",
    message: "document.write taqiqlangan.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    name: "zetra/xavfsizlik-va-i18n",
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/test/**"],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      // Har bir `dangerouslySetInnerHTML` sababi yozilgan izoh bilan
      // alohida ruxsat etiladi.
      "react/no-danger": "error",
    },
  },
  {
    // localStorage bilan faqat shu past darajali qatlam ishlaydi.
    name: "zetra/saqlash-qatlami",
    files: ["src/store/storage.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntax.filter((rule) => rule.message !== STORAGE_MESSAGE),
      ],
    },
  },
  {
    name: "zetra/a11y",
    files: ["src/**/*.tsx"],
    ignores: ["src/**/*.test.tsx"],
    rules: {
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": ["error", { assert: "either", depth: 3 }],
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
