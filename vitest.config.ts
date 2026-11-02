import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Runs the framework-workspace engine tests only (src/__tests__).
 * The platform's own unit tests in unit/*.test.mjs use node:test (npm run test:unit) and Playwright
 * covers the browser (tests/), so neither is picked up here.
 */
export default defineConfig({
  // Same "@/…" alias as tsconfig.json, so tests can import modules that use it.
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
