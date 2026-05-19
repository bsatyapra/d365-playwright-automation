import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeadListPage extends BasePage {
  async navigateToLeads(): Promise<void> {
    // Navigate directly to the Leads entity list — avoids app picker / navbar race
    const d365Url = process.env.D365_URL!.replace(/\/$/, '');
    await this.page.goto(`${d365Url}/main.aspx?pagetype=entitylist&etn=lead`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForSpinner(60000);
    // Wait for the New button — reliable indicator the list is fully loaded
    // Works in both "in app" and "no app" D365 contexts
    await this.page
      .locator('button[aria-label="New"], [data-id*="NewRecord"], button:has-text("New")')
      .first()
      .waitFor({ state: 'visible', timeout: 60000 });
  }

  async clickNewLead(): Promise<void> {
    await this.page
      .locator('button[aria-label="New"], [data-id*="NewRecord"]')
      .first()
      .click();
    await this.waitForSpinner();
    await this.page.locator('[data-id="header_title"]').waitFor({ state: 'visible' });
  }

  async searchLead(searchText: string): Promise<boolean> {
    const searchBox = this.page
      .locator('[data-id="quickFind"], input[aria-label="Search"], input[aria-label="Filter by keyword"]')
      .first();
    await searchBox.fill(searchText);
    await searchBox.press('Enter');
    await this.waitForSpinner();
    // Rows in both in-app and no-app D365 contexts have role="row" with aria-label
    const rows = this.page.locator('[role="row"][aria-label]');
    await expect(rows.first()).toBeVisible({ timeout: 15000 }).catch(() => {});
    return (await rows.count()) > 0;
  }

  async openLeadByName(name: string): Promise<void> {
    await this.page
      .locator('[role="row"] a, [role="gridcell"] a')
      .filter({ hasText: name })
      .first()
      .click();
    await this.waitForSpinner();
    await this.page.locator('[data-id="header_title"]').waitFor({ state: 'visible' });
  }

  async getLeadCount(): Promise<number> {
    return this.page.locator('[role="row"][aria-label]').count();
  }

  async switchView(viewName: string): Promise<void> {
    await this.page.locator('[data-id="ViewSelector"], button[aria-label*="view"]').first().click();
    await this.page.locator(`[role="option"]:has-text("${viewName}")`).click();
    await this.waitForSpinner();
  }
}
