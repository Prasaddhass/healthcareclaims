import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./src/test/setup.ts'],
    css:         false,
    testTimeout: 15000,
  },
  resolve: {
    alias: { '@': `${import.meta.dirname}/src` },
  },
});
