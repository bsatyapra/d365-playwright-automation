import { type Page } from '@playwright/test';

export class BasePage {
  constructor(readonly page: Page) {}

  async waitForSpinner(timeout = 45000): Promise<void> {
    const spinners = [
      '[data-id="globalLoadingSpinner"]',
      '.progressIndicator',
      '[data-id="mscrm_busyIndicator"]',
    ];
    const deadline = Date.now() + timeout;
    for (const selector of spinners) {
      const locator = this.page.locator(selector);
      const count = await locator.count();
      if (count > 0) {
        await locator
          .first()
          .waitFor({ state: 'hidden', timeout: Math.max(1000, deadline - Date.now()) })
          .catch(() => {});
      }
    }
  }

  async saveForm(): Promise<void> {
    await this.page.locator('button[data-id="edit-form-save"]').click();
    await this.waitForSpinner();
    const errorBanner = this.page.locator('[data-id="errorNotificationContainer"]');
    if (await errorBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      const msg = await errorBanner.textContent();
      throw new Error(`D365 save error: ${msg}`);
    }
  }

  async navigateToArea(area: string, subArea: string): Promise<void> {
    // Navigate to D365 first if we're not already there
    if (!this.page.url().includes('dynamics.com')) {
      await this.page.goto(process.env.D365_URL!);
      await this.page.waitForLoadState('domcontentloaded');
      await this.waitForSpinner(30000);
    }

    // App picker may appear before navbar — click the matching app tile if visible
    const navbar = this.page.locator('[data-id="navbar-main"]');
    if (!(await navbar.isVisible({ timeout: 5000 }).catch(() => false))) {
      const appTile = this.page
        .locator(`[title*="${area}"], [aria-label*="${area}"], [data-id*="${area}"]`)
        .first();
      if (await appTile.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appTile.click();
        await this.waitForSpinner(30000);
      }
    }

    await navbar.waitFor({ state: 'visible', timeout: 45000 });
    const switcher = this.page.locator('[data-id="areaSwitcherId"], button[data-id="sitemap-top-area-launcher"]');
    if (await switcher.isVisible({ timeout: 3000 }).catch(() => false)) {
      await switcher.click();
    }
    await this.page.locator(`[data-text="${area}"], [title="${area}"]`).first().click();
    await this.waitForSpinner();
    await this.page.locator(`[data-text="${subArea}"], [title="${subArea}"]`).first().click();
    await this.waitForSpinner();
  }

  async resolveLookup(fieldDataId: string, searchText: string): Promise<void> {
    const input = this.page.locator(`[data-id*="${fieldDataId}"] input`).first();
    await input.fill(searchText);
    await this.page
      .locator('[aria-label="Lookup results"], [role="listbox"]')
      .first()
      .waitFor({ state: 'visible' });
    await this.page.locator('[aria-label="Lookup results"] li, [role="option"]').first().click();
  }

  async getNotificationText(): Promise<string> {
    const notification = this.page.locator('[data-id="notificationWrapper"]');
    return (await notification.textContent()) ?? '';
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForSpinner();
  }
}
