import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  async navigate(d365Url: string): Promise<void> {
    await this.page.goto(d365Url);
  }

  async completeAADLogin(username: string, password: string): Promise<void> {
    // Email step
    await this.page.locator('input[type="email"], input[name="loginfmt"]').fill(username);
    await this.page.locator('input[type="submit"], button[type="submit"]').first().click();

    // Password step
    await this.page.locator('input[type="password"], input[name="passwd"]').waitFor({ state: 'visible' });
    await this.page.locator('input[type="password"], input[name="passwd"]').fill(password);
    await this.page.locator('input[type="submit"], button[type="submit"]').first().click();

    // "Stay signed in?" prompt
    const staySignedIn = this.page.locator('button[id="idSIButton9"]');
    if (await staySignedIn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await staySignedIn.click();
    }

    // Wait for D365 to fully load
    await this.page.waitForURL(/crm\.dynamics\.com/, { timeout: 60000 });
    await this.page.locator('[data-id="navbar-main"]').waitFor({ state: 'visible', timeout: 60000 });
    await this.waitForSpinner(30000);
  }
}
