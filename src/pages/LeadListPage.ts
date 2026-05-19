import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeadListPage extends BasePage {
  private readonly gridContainer = '[data-id="entity_control-pcf_grid_control_container"]';

  async navigateToLeads(): Promise<void> {
    await this.navigateToArea('Sales', 'Leads');
    await this.page.locator(this.gridContainer).waitFor({ state: 'visible' });
  }

  async clickNewLead(): Promise<void> {
    await this.page
      .locator('button[data-id="new-lead"], button[aria-label="New"], [data-id="MainGrid|NoRelationship|HomePageGrid|Mscrm.HomepageGrid.lead.NewRecord"]')
      .first()
      .click();
    await this.waitForSpinner();
    await this.page.locator('[data-id="header_title"], [data-id="form-header"]').waitFor({ state: 'visible' });
  }

  async searchLead(searchText: string): Promise<boolean> {
    const searchBox = this.page.locator('[data-id="quickFind"], input[aria-label="Search"]').first();
    await searchBox.fill(searchText);
    await searchBox.press('Enter');
    await this.waitForSpinner();
    const rows = this.page.locator(`${this.gridContainer} [role="row"][aria-label]`);
    await expect(rows.first()).toBeVisible({ timeout: 15000 }).catch(() => {});
    return (await rows.count()) > 0;
  }

  async openLeadByName(name: string): Promise<void> {
    await this.page.locator(`${this.gridContainer} [role="row"] a`).filter({ hasText: name }).first().click();
    await this.waitForSpinner();
    await this.page.locator('[data-id="header_title"]').waitFor({ state: 'visible' });
  }

  async getLeadCount(): Promise<number> {
    const rows = this.page.locator(`${this.gridContainer} [role="row"][aria-label]`);
    return rows.count();
  }

  async switchView(viewName: string): Promise<void> {
    await this.page.locator('[data-id="ViewSelector"], button[aria-label*="view"]').first().click();
    await this.page.locator(`[role="option"]:has-text("${viewName}")`).click();
    await this.waitForSpinner();
  }
}
