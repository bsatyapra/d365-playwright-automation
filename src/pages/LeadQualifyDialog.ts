import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeadQualifyDialog extends BasePage {
  private dialog = this.page.locator('[role="dialog"], .ms-Dialog, [data-id*="qualifyDialog"]').first();

  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async setCreateOpportunity(checked: boolean): Promise<void> {
    await this.setCheckbox('Opportunity', checked);
  }

  async setCreateContact(checked: boolean): Promise<void> {
    await this.setCheckbox('Contact', checked);
  }

  async setCreateAccount(checked: boolean): Promise<void> {
    await this.setCheckbox('Account', checked);
  }

  private async setCheckbox(label: string, checked: boolean): Promise<void> {
    const checkbox = this.dialog.locator(`[aria-label*="${label}"] input[type="checkbox"], input[aria-label*="${label}"]`).first();
    const isChecked = await checkbox.isChecked();
    if (isChecked !== checked) {
      await checkbox.click();
    }
  }

  async clickOK(): Promise<void> {
    await this.dialog.locator('button[aria-label="OK"], button:has-text("OK")').first().click();
    await this.waitForSpinner();
  }

  async clickCancel(): Promise<void> {
    await this.dialog.locator('button[aria-label="Cancel"], button:has-text("Cancel")').first().click();
  }

  async selectDisqualifyReason(reason: string): Promise<void> {
    const select = this.dialog.locator('select, [role="combobox"]').first();
    await select.selectOption({ label: reason });
  }
}
