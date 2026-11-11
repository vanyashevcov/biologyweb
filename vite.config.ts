import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
  css: { modules: { localsConvention: 'camelCaseOnly' } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
