import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the build can be opened from any folder or published as a static page.
  base: './',
  build: {
    rollupOptions: {
      // KOALITIC_ENTRY=app builds only the app (one bundle), used to publish a single-page preview.
      input: process.env.KOALITIC_ENTRY === 'app'
        ? { app: fileURLToPath(new URL('./index.html', import.meta.url)) }
        : {
            app: fileURLToPath(new URL('./index.html', import.meta.url)),
            lab: fileURLToPath(new URL('./lab.html', import.meta.url)),
          },
    },
  },
  test: { include: ['src/**/*.test.ts'] },
});
