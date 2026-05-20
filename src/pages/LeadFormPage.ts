import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeadFormPage extends BasePage {
  // Returns the Lead Title (subject) value — the primary identifier in this custom form.
  // Falls back to the header_title element if subject input is not visible.
  async getHeaderTitle(): Promise<string> {
    const subjectInput = this.page
      .locator('[data-id*="subject"] input, [data-id="subject"] input')
      .first();
    if (await subjectInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const val = await subjectInput.inputValue();
      if (val) return val;
    }
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
    const saveBtn = this.page.locator('button[data-id="edit-form-save"], button[aria-label="Save"]').first();
    return !(await saveBtn.isVisible({ timeout: 2000 }).catch(() => false));
  }

  // Sets Lead Title (subject) and fills the mandatory companion fields required by this custom form.
  // When Is Existing Client = No, Company Name and Lead Source are both required.
  async fillLastName(value: string): Promise<void> {
    await this.page
      .locator('[data-id*="subject"] input, [data-id="subject"] input')
      .first()
      .fill(value);
    await this.setIsExistingClientNo();
    // Company Name and Lead Source become required when Is Existing Client = No
    await this.fillCompany('Test Corp');
    await this.selectLeadSource('Web');
  }

  private async setIsExistingClientNo(): Promise<void> {
    const trigger = this.page
      .locator(
        'button[aria-label*="Existing Client"], [role="combobox"][aria-label*="Existing"], ' +
        '[data-id*="existingclient"] button, [data-id*="existingclient"] [role="combobox"], ' +
        '[data-id*="existing"] button[aria-haspopup], [data-id*="isexisting"] [role="combobox"]'
      )
      .first();

    const byLabel = this.page.getByLabel(/Is Existing Client/i);

    const target = (await trigger.isVisible({ timeout: 2000 }).catch(() => false))
      ? trigger
      : (await byLabel.first().isVisible({ timeout: 1000 }).catch(() => false))
        ? byLabel.first()
        : null;

    if (!target) return;
    await target.click().catch(() => {});
    await this.page
      .locator('[role="option"]:has-text("No"), [role="listbox"] li:has-text("No")')
      .first()
      .click({ timeout: 5000 })
      .catch(() => {});
  }

  async fillFirstName(_value: string): Promise<void> {
    // Not present on the HE Commercial Engagement Lead Form — skip
  }

  async fillTopic(_value: string): Promise<void> {
    // Maps to same subject field as fillLastName — skip to avoid overwriting the unique value
  }

  async fillCompany(value: string): Promise<void> {
    // Appears in NEW ACCOUNT DETAILS section when Is Existing Client = No
    await this.page
      .locator('[data-id*="companyname"] input, [data-id="companyname"] input')
      .first()
      .fill(value)
      .catch(() => {});
  }

  async fillEmail(_value: string): Promise<void> {
    // Not present on the HE Commercial Engagement Lead Form — skip
  }

  async fillPhone(_value: string): Promise<void> {
    // Not present on the HE Commercial Engagement Lead Form — skip
  }

  async fillJobTitle(_value: string): Promise<void> {
    // Not present on the HE Commercial Engagement Lead Form — skip
  }

  async selectLeadSource(value: string): Promise<void> {
    // Lead Source is a FluentUI dropdown — click trigger then pick option
    const trigger = this.page
      .locator('[data-id*="leadsourcecode"] [role="combobox"], [data-id*="leadsourcecode"] button')
      .first();
    if (await trigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trigger.click();
      await this.page
        .locator(`[role="option"]:has-text("${value}")`)
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});
    } else {
      // Fallback: native select (in-app D365 context)
      await this.page
        .locator('[data-id*="leadsourcecode"] select, [data-id="leadsourcecode"] select')
        .first()
        .selectOption({ label: value })
        .catch(() => {});
    }
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
    const errorMsg = this.page.locator(
      `[data-id*="${fieldDataId}"] .ms-TextField-errorMessage, [data-id*="${fieldDataId}"] + .ms-TextField-errorMessage`
    );
    return errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
  }
}
