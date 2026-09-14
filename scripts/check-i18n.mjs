#!/usr/bin/env node
/**
 * Tarjima jadvalini tekshiradi.
 *
 * Ushbu skript loyihada haqiqatan yuz bergan xatolarni qayta paydo bo'lishdan
 * saqlaydi:
 *  - `UserProfileModal.tsx` dagi ruscha matn ikki marta kodlangan edi
 *    ("Ð˜Ð¼Ñ ..."), va buni hech kim sezmagan;
 *  - ikki tarmoqli inline tarjimalar tufayli bir til jimgina tushib qolardi;
 *  - `translations.ts` 1 000 qatordan oshgan, JS obyektida takroriy kalit esa
 *    xatosiz, jimgina oldingisini bekor qiladi.
 *
 * Fayl regex bilan emas, TypeScript AST orqali o'qiladi — shuning uchun
 * qochirilgan qo'shtirnoq yoki ko'p qatorli satr natijani buzmaydi.
 *
 * Ishlatish:
 *   node scripts/check-i18n.mjs            xatolar bo'lsa 1 bilan chiqadi
 *   node scripts/check-i18n.mjs --strict   ogohlantirishlar ham xato hisoblanadi
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

export const LOCALES = ['uz', 'ru', 'en'];
export const BASE_LOCALE = 'uz';

/** Ikki marta kodlangan UTF-8 va almashtirish belgisi. O'zbek, rus va ingliz matnida bular uchramaydi. */
const MOJIBAKE = /[ÐÑ]|â€|ðŸ|Ã[-¿]|�/;
const PLACEHOLDER = /\{(\w+)\}/g;

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return null;
}

function unwrap(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

/**
 * `translations` obyektini o'qiydi.
 * Har bir til uchun: kalit -> qiymat (satr bo'lmasa `null`), takroriy va
 * satr bo'lmagan kalitlar ro'yxati.
 */
export function extractTranslations(sourceText, fileName = 'translations.ts') {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let root = null;
  const visit = (node) => {
    if (root) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'translations' &&
      node.initializer
    ) {
      const initializer = unwrap(node.initializer);
      if (ts.isObjectLiteralExpression(initializer)) root = initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  if (!root) {
    throw new Error(`${fileName}: "translations" obyekti topilmadi`);
  }

  const locales = {};
  for (const property of root.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const locale = propertyName(property.name);
    const body = unwrap(property.initializer);
    if (!locale || !ts.isObjectLiteralExpression(body)) continue;

    const entries = new Map();
    const duplicates = [];
    const nonString = [];

    for (const entry of body.properties) {
      if (!ts.isPropertyAssignment(entry)) {
        nonString.push(entry.getText(source).slice(0, 40));
        continue;
      }
      const key = propertyName(entry.name);
      if (key === null) continue;
      if (entries.has(key)) duplicates.push(key);

      const value = entry.initializer;
      if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
        entries.set(key, value.text);
      } else {
        nonString.push(key);
        entries.set(key, null);
      }
    }

    locales[locale] = { entries, duplicates, nonString };
  }

  return locales;
}

function placeholderShape(value) {
  return [...value.matchAll(PLACEHOLDER)]
    .map((match) => match[1])
    .sort()
    .join(',');
}

/** Tuzilma tekshiruvi: tillar mosligi, takrorlar, bo'sh qiymat, mojibake, o'rinbosarlar. */
export function analyzeTranslations(locales) {
  const errors = [];
  const warnings = [];

  for (const locale of LOCALES) {
    if (!locales[locale]) errors.push(`"${locale}" tili topilmadi`);
  }
  const present = LOCALES.filter((locale) => locales[locale]);

  const allKeys = new Set(present.flatMap((locale) => [...locales[locale].entries.keys()]));

  for (const locale of present) {
    const { entries, duplicates, nonString } = locales[locale];

    for (const key of duplicates) errors.push(`[${locale}] takroriy kalit: ${key}`);
    for (const key of nonString) errors.push(`[${locale}] satr bo'lmagan qiymat: ${key}`);

    for (const key of allKeys) {
      if (!entries.has(key)) errors.push(`[${locale}] kalit yetishmaydi: ${key}`);
    }

    for (const [key, value] of entries) {
      if (value === null) continue;
      if (value.trim() === '') errors.push(`[${locale}] bo'sh qiymat: ${key}`);
      if (MOJIBAKE.test(value)) errors.push(`[${locale}] buzilgan kodirovka (mojibake): ${key}`);
    }
  }

  for (const key of allKeys) {
    const shapes = present
      .map((locale) => locales[locale].entries.get(key))
      .filter((value) => typeof value === 'string')
      .map(placeholderShape);
    if (new Set(shapes).size > 1) errors.push(`o'rinbosarlar tillar orasida mos emas: ${key}`);
  }

  return { errors, warnings };
}

const T_CALL = /\bt\(\s*(['"])([A-Za-z0-9_.-]+)\1\s*[,)]/g;
const STRING_LITERAL = /(['"`])([a-z0-9_]+)\1/g;

/** Manba fayllardagi `t('kalit')` chaqiruvlari va barcha satr literallarini yig'adi. */
export function scanSources(files) {
  const called = new Map();
  const literals = new Set();

  for (const { path: file, text } of files) {
    for (const match of text.matchAll(T_CALL)) {
      const line = text.slice(0, match.index).split('\n').length;
      const key = match[2];
      if (!called.has(key)) called.set(key, []);
      called.get(key).push(`${file}:${line}`);
    }
    for (const match of text.matchAll(STRING_LITERAL)) {
      literals.add(match[2]);
    }
  }

  return { called, literals };
}

/**
 * Kod va jadval mosligi.
 * Kodda chaqirilgan, lekin jadvalda yo'q kalit — xato (foydalanuvchi kalit
 * nomini ko'radi). Jadvalda bor, lekin hech qayerda satr sifatida uchramaydigan
 * kalit — ogohlantirish (dinamik hosil qilingan bo'lishi mumkin).
 */
export function analyzeUsage(knownKeys, { called, literals }) {
  const errors = [];
  const warnings = [];

  for (const [key, locations] of called) {
    if (!knownKeys.has(key)) {
      errors.push(`kodda ishlatilgan, lekin tarjimada yo'q: ${key} (${locations.join(', ')})`);
    }
  }

  for (const key of knownKeys) {
    if (!literals.has(key)) warnings.push(`ishlatilmayotgan kalit: ${key}`);
  }

  return { errors, warnings };
}

function walk(directory) {
  const out = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

export function runCheck(projectRoot) {
  const translationsPath = path.join(projectRoot, 'src', 'utils', 'translations.ts');
  const locales = extractTranslations(readFileSync(translationsPath, 'utf8'), translationsPath);
  const structural = analyzeTranslations(locales);

  const files = walk(path.join(projectRoot, 'src'))
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => path.resolve(file) !== path.resolve(translationsPath))
    .filter((file) => !/\.test\.tsx?$/.test(file))
    .map((file) => ({
      path: path.relative(projectRoot, file).replaceAll('\\', '/'),
      text: readFileSync(file, 'utf8'),
    }));

  const knownKeys = new Set(locales[BASE_LOCALE]?.entries.keys() ?? []);
  const usage = analyzeUsage(knownKeys, scanSources(files));

  return {
    keyCount: knownKeys.size,
    localeCount: LOCALES.filter((locale) => locales[locale]).length,
    errors: [...structural.errors, ...usage.errors],
    warnings: [...structural.warnings, ...usage.warnings],
  };
}

const invokedDirectly =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  const strict = process.argv.includes('--strict');
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = runCheck(projectRoot);

  for (const warning of result.warnings) console.warn(`  ogohlantirish  ${warning}`);
  for (const error of result.errors) console.error(`  xato           ${error}`);

  const failed = result.errors.length > 0 || (strict && result.warnings.length > 0);
  console.log(
    `i18n: ${result.keyCount} kalit x ${result.localeCount} til, ` +
      `${result.errors.length} xato, ${result.warnings.length} ogohlantirish` +
      (failed ? ' — MUVAFFAQIYATSIZ' : ' — OK'),
  );
  process.exitCode = failed ? 1 : 0;
}
