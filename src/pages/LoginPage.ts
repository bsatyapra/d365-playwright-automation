import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  async navigate(d365Url: string): Promise<void> {
    await this.page.goto(d365Url);
  }

  async completeAADLogin(username: string, password: string): Promise<void> {
    // Email step — wait for the field to be stable before filling
    const emailField = this.page.locator('input[type="email"], input[name="loginfmt"]');
    await emailField.waitFor({ state: 'visible', timeout: 30000 });
    await emailField.fill(username);

    // Click Next (Microsoft login Next button)
    const nextBtn = this.page.locator('input[type="submit"][value="Next"], input#idSIButton9, button#idSIButton9, input[type="submit"]').first();
    await nextBtn.click();

    // Password step — might be on same page or after redirect
    const passwordField = this.page.locator('input[type="password"], input[name="passwd"]');
    await passwordField.waitFor({ state: 'visible', timeout: 30000 });
    await passwordField.fill(password);

    const signInBtn = this.page.locator('input[type="submit"][value="Sign in"], input#idSIButton9, button#idSIButton9, input[type="submit"]').first();
    await signInBtn.click();

    // "Stay signed in?" prompt — click Yes if shown
    const staySignedIn = this.page.locator('#idSIButton9, button[id="idSIButton9"]');
    if (await staySignedIn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await staySignedIn.click();
    }

    // MFA / Conditional Access: if still on login domain, wait up to 3 minutes for
    // user to complete any MFA challenge in the headed browser window
    const onLoginPage = this.page.url().includes('login.microsoftonline.com') ||
                        this.page.url().includes('login.live.com');
    if (onLoginPage) {
      console.log('\n⚠  MFA or additional prompt detected — complete it in the browser window (3 min timeout)...');
      await this.page.waitForURL(/dynamics\.com/, { timeout: 180000 });
    }

    // Wait for D365 to fully load — use networkidle since navbar selector varies by app
    await this.page.waitForURL(/dynamics\.com/, { timeout: 60000 });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await this.waitForSpinner(60000);
  }
}
