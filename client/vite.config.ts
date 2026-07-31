import { readFileSync } from 'node:fs';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { assertGameContentValid } from './src/game/content/validation';

assertGameContentValid();

const packageVersion = (
  JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  ) as { version: string }
).version;

export default defineConfig(({ command }) => {
  const buildId =
    process.env.GITHUB_SHA?.slice(0, 12) ??
    process.env.VITE_BUILD_ID ??
    (command === 'build' ? 'local-build' : 'local-dev');
  return {
    base: command === 'build' ? '/GymBuddies/' : '/',
    define: {
      __GYM_BUDDIES_BUILD_ID__: JSON.stringify(buildId),
      __GYM_BUDDIES_VERSION__: JSON.stringify(packageVersion),
    },
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
  };
});
