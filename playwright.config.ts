import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const storageStatePath = 'auth/storageState.json';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/globalSetup',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90000,
  expect: { timeout: 15000 },

  use: {
    baseURL: process.env.D365_URL,
    storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  outputDir: 'results/artifacts',

  reporter: [
    ['list'],
    ['./src/reporters/outcomes-reporter'],
    ['html', { outputFolder: 'results/playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'results/allure-results' }],
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
