import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { LoginPage } from '../src/pages/LoginPage';

dotenv.config();

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const d365Url = process.env.D365_URL;
  const username = process.env.D365_USERNAME;
  const password = process.env.D365_PASSWORD;

  if (!d365Url || !username || !password) {
    throw new Error('Missing D365_URL, D365_USERNAME, or D365_PASSWORD in .env');
  }

  const authDir = path.join(process.cwd(), 'auth');
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.navigate(d365Url);
  await loginPage.completeAADLogin(username, password);

  await context.storageState({ path: path.join(authDir, 'storageState.json') });
  await browser.close();

  console.log('✓ D365 authentication complete — storageState saved');
}
