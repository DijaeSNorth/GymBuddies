import { defineConfig, devices } from '@playwright/test';
import deployment from './deployment.config.json' with { type: 'json' };

const developmentBaseUrl = 'http://127.0.0.1:4175';
const pagesBaseUrl = 'http://127.0.0.1:4176';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [['line']],
  outputDir: 'test-results',
  use: {
    baseURL: developmentBaseUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'desktop-chromium',
      testMatch:
        /(?:onboarding|controls-and-settings|performance|character-gallery)\.pw\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'mobile-touch',
      testMatch: /touch-controls\.pw\.ts/,
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'github-pages',
      testMatch: /github-pages\.pw\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: pagesBaseUrl,
      },
    },
  ],
  webServer: [
    {
      command:
        'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
      url: developmentBaseUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run preview:pages:test',
      url: `${pagesBaseUrl}${deployment.basePath}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
