import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the build can be opened from any folder or published as a static page.
  base: './',
  test: { include: ['src/**/*.test.ts'] },
});
