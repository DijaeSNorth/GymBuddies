import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { assertGameContentValid } from './src/game/content/validation';

assertGameContentValid();

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/GymBuddies/' : '/',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
