import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AssignDialog extends BasePage {
  private dialog = this.page.locator('[role="dialog"], .ms-Dialog, [data-id*="assignDialog"]').first();

  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async selectAssignToMe(): Promise<void> {
    await this.dialog.locator('[aria-label="Assign to me"], input[value*="me"]').first().click();
  }

  async selectAssignToUserOrTeam(): Promise<void> {
    await this.dialog.locator('[aria-label*="user or team"], input[value*="user"]').first().click();
  }

  async setUserOrTeam(name: string): Promise<void> {
    const input = this.dialog.locator('[data-id*="ownerid"] input, input[aria-label*="User"]').first();
    await input.fill(name);
    await this.page.locator('[aria-label="Lookup results"] li, [role="option"]').first().waitFor({ state: 'visible' });
    await this.page.locator('[aria-label="Lookup results"] li, [role="option"]').first().click();
  }

  async clickOK(): Promise<void> {
    await this.dialog.locator('button[aria-label="OK"], button:has-text("OK")').first().click();
    await this.waitForSpinner();
  }

  async clickCancel(): Promise<void> {
    await this.dialog.locator('button[aria-label="Cancel"], button:has-text("Cancel")').first().click();
  }
}
