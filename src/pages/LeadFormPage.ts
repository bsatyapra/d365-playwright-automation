import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeadFormPage extends BasePage {
  async getHeaderTitle(): Promise<string> {
    return (await this.page.locator('[data-id="header_title"]').textContent()) ?? '';
  }

  async getStatusLabel(): Promise<string> {
    return (
      (await this.page
        .locator('[data-id*="statuscode"] option:checked, [data-id*="statuscode"] .ms-BasePicker-text')
        .first()
        .textContent()) ?? ''
    );
  }

  async isFormReadOnly(): Promise<boolean> {
    const saveBtn = this.page.locator('button[data-id="edit-form-save"]');
    return !(await saveBtn.isVisible({ timeout: 2000 }).catch(() => false));
  }

  async fillFirstName(value: string): Promise<void> {
    await this.page.locator('[data-id*="firstname"] input, [data-id="firstname"] input').first().fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.page.locator('[data-id*="lastname"] input, [data-id="lastname"] input').first().fill(value);
  }

  async fillTopic(value: string): Promise<void> {
    await this.page.locator('[data-id*="subject"] input, [data-id="subject"] input').first().fill(value);
  }

  async fillCompany(value: string): Promise<void> {
    await this.page.locator('[data-id*="companyname"] input, [data-id="companyname"] input').first().fill(value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.page.locator('[data-id*="emailaddress1"] input, [data-id="emailaddress1"] input').first().fill(value);
  }

  async fillPhone(value: string): Promise<void> {
    await this.page.locator('[data-id*="telephone1"] input, [data-id="telephone1"] input').first().fill(value);
  }

  async fillJobTitle(value: string): Promise<void> {
    await this.page.locator('[data-id*="jobtitle"] input, [data-id="jobtitle"] input').first().fill(value);
  }

  async selectLeadSource(value: string): Promise<void> {
    await this.page.locator('[data-id*="leadsourcecode"] select, [data-id="leadsourcecode"] select').first().selectOption({ label: value });
  }

  async getOwnerValue(): Promise<string> {
    return (
      (await this.page
        .locator('[data-id*="ownerid"] .ms-BasePicker-text, [data-id*="ownerid"] input')
        .first()
        .inputValue()
        .catch(async () => this.page.locator('[data-id*="ownerid"]').first().textContent())) ?? ''
    );
  }

  async clickQualify(): Promise<void> {
    await this.page.locator('button[aria-label="Qualify"], [data-id*="qualify"]').first().click();
    await this.waitForSpinner();
  }

  async clickDisqualify(): Promise<void> {
    await this.page.locator('button[aria-label="Disqualify"], [data-id*="disqualify"]').first().click();
    await this.waitForSpinner();
  }

  async clickAssign(): Promise<void> {
    await this.page.locator('button[aria-label="Assign"], [data-id*="assign"]').first().click();
    await this.waitForSpinner();
  }

  async clickReactivate(): Promise<void> {
    await this.page.locator('button[aria-label="Reactivate Lead"], [data-id*="reactivate"]').first().click();
    await this.waitForSpinner();
  }

  async hasValidationError(fieldDataId: string): Promise<boolean> {
    const errorMsg = this.page.locator(`[data-id*="${fieldDataId}"] .ms-TextField-errorMessage, [data-id*="${fieldDataId}"] + .ms-TextField-errorMessage`);
    return errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
  }
}
