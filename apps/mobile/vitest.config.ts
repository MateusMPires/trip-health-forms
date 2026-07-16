import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    // Only the deterministic, RN-free modules are tested (sync logic, mapping).
    include: ['tests/**/*.test.ts'],
  },
});
