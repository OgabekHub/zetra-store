import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/store/**', 'src/schemas/**', 'src/utils/**', 'src/hooks/**', 'src/lib/**'],
      exclude: ['src/utils/translations.ts', '**/*.test.*', 'src/test/**'],
      reporter: ['text-summary', 'text'],
      // Pastki chegara: store, sxema va utilitalar sof mantiq — ular yaxshi
      // qoplangan bo'lishi shart. Komponentlar hozircha hisobga olinmaydi.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
