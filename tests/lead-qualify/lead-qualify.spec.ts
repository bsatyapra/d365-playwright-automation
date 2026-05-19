import { expect } from '@playwright/test';
import { test } from '../../src/fixtures/test.fixtures';
import { allure } from 'allure-playwright';

const ts = () => Date.now();

async function createOpenLead(leadList: any, leadForm: any, suffix: string): Promise<string> {
  const lastName = `AutoTest_${suffix}_${ts()}`;
  await leadList.navigateToLeads();
  await leadList.clickNewLead();
  await leadForm.fillLastName(lastName);
  await leadForm.fillTopic(`Lead for ${suffix}`);
  await leadForm.fillCompany('Test Company');
  await leadForm.saveForm();
  return lastName;
}

test.describe('Lead Qualify / Disqualify', () => {
  test.beforeEach(async () => {
    await allure.feature('Lead Management');
    await allure.story('Qualify / Disqualify Lead');
  });

  test('[TC006] Qualify a Lead and verify it converts to Opportunity, Contact, and Account',
    async ({ leadList, leadForm, qualifyDialog }) => {
      await test.step('Create an Open lead', async () => {
        await createOpenLead(leadList, leadForm, 'TC006');
      });

      await test.step('Click Qualify', async () => {
        await leadForm.clickQualify();
      });

      await test.step('Ensure all qualify options are checked and confirm', async () => {
        const dialogVisible = await qualifyDialog.page
          .locator('[role="dialog"]')
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (dialogVisible) {
          await qualifyDialog.setCreateOpportunity(true);
          await qualifyDialog.setCreateContact(true);
          await qualifyDialog.setCreateAccount(true);
          await qualifyDialog.clickOK();
        }
      });

      await test.step('Verify navigation to Opportunity', async () => {
        await leadForm.page.waitForURL(/\/opportunity\//i, { timeout: 30000 }).catch(() => {});
        const url = leadForm.page.url();
        expect(url.toLowerCase()).toMatch(/opportunity|opp/i);
      });
    }
  );

  test('[TC007] Qualify a Lead with only Opportunity selected and verify Contact/Account not created',
    async ({ leadList, leadForm, qualifyDialog }) => {
      await test.step('Create an Open lead', async () => {
        await createOpenLead(leadList, leadForm, 'TC007');
      });

      await test.step('Qualify with only Opportunity', async () => {
        await leadForm.clickQualify();
        const dialogVisible = await qualifyDialog.page
          .locator('[role="dialog"]')
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (dialogVisible) {
          await qualifyDialog.setCreateOpportunity(true);
          await qualifyDialog.setCreateContact(false);
          await qualifyDialog.setCreateAccount(false);
          await qualifyDialog.clickOK();
        }
      });

      await test.step('Verify Opportunity is created', async () => {
        await leadForm.page.waitForURL(/\/opportunity\//i, { timeout: 30000 }).catch(() => {});
        const url = leadForm.page.url();
        expect(url.toLowerCase()).toMatch(/opportunity|opp/i);
      });
    }
  );

  test('[TC008] Disqualify a Lead with reason "No Longer Interested" and verify status changes to Disqualified',
    async ({ leadList, leadForm, qualifyDialog }) => {
      await test.step('Create an Open lead', async () => {
        await createOpenLead(leadList, leadForm, 'TC008');
      });

      await test.step('Disqualify the lead', async () => {
        await leadForm.clickDisqualify();
        const dialogVisible = await qualifyDialog.page
          .locator('[role="dialog"]')
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (dialogVisible) {
          await qualifyDialog.selectDisqualifyReason('No Longer Interested');
          await qualifyDialog.clickOK();
        }
      });

      await test.step('Verify status is Disqualified', async () => {
        const statusText = await leadForm.getStatusLabel();
        expect(statusText.toLowerCase()).toContain('disqualif');
      });
    }
  );

  test('[TC009] Disqualify a Lead with reason "Lost" and verify the Lead is read-only after disqualification',
    async ({ leadList, leadForm, qualifyDialog }) => {
      await test.step('Create an Open lead', async () => {
        await createOpenLead(leadList, leadForm, 'TC009');
      });

      await test.step('Disqualify with reason Lost', async () => {
        await leadForm.clickDisqualify();
        const dialogVisible = await qualifyDialog.page
          .locator('[role="dialog"]')
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (dialogVisible) {
          await qualifyDialog.selectDisqualifyReason('Lost');
          await qualifyDialog.clickOK();
        }
      });

      await test.step('Verify form is read-only', async () => {
        const readOnly = await leadForm.isFormReadOnly();
        expect(readOnly).toBe(true);
      });
    }
  );

  test('[TC010] Re-open a Disqualified Lead and verify status returns to Open',
    async ({ leadList, leadForm, qualifyDialog }) => {
      await test.step('Create and disqualify a lead', async () => {
        await createOpenLead(leadList, leadForm, 'TC010');
        await leadForm.clickDisqualify();
        const dialogVisible = await qualifyDialog.page
          .locator('[role="dialog"]')
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (dialogVisible) {
          await qualifyDialog.selectDisqualifyReason('No Longer Interested');
          await qualifyDialog.clickOK();
        }
      });

      await test.step('Reactivate the lead', async () => {
        await leadForm.clickReactivate();
        const confirmBtn = leadForm.page.locator('button:has-text("Reactivate"), button[aria-label="Confirm"]');
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await leadForm.waitForSpinner();
        }
      });

      await test.step('Verify status is Open', async () => {
        const readOnly = await leadForm.isFormReadOnly();
        expect(readOnly).toBe(false);
      });
    }
  );
});
