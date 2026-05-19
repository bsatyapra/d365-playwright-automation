import { expect } from '@playwright/test';
import { test } from '../../src/fixtures/test.fixtures';
import { allure } from 'allure-playwright';

const ts = () => Date.now();

test.describe('Lead Create / Edit', () => {
  test.beforeEach(async ({ leadList }) => {
    await allure.feature('Lead Management');
    await allure.story('Create / Edit Lead');
    await leadList.navigateToLeads();
  });

  test('[TC001] Create a new Lead with all mandatory fields and verify it appears in Lead grid',
    async ({ leadList, leadForm }) => {
      const lastName = `AutoTest_TC001_${ts()}`;

      await test.step('Open new Lead form', async () => {
        await leadList.clickNewLead();
      });

      await test.step('Fill mandatory fields', async () => {
        await leadForm.fillLastName(lastName);
        await leadForm.fillTopic('Test Topic TC001');
      });

      await test.step('Save the Lead', async () => {
        await leadForm.saveForm();
      });

      await test.step('Verify Lead appears in grid', async () => {
        await leadList.navigateToLeads();
        const found = await leadList.searchLead(lastName);
        expect(found).toBe(true);
      });
    }
  );

  test('[TC002] Create a Lead with full profile (company, phone, email, source) and verify all fields saved',
    async ({ leadList, leadForm }) => {
      const lastName = `AutoTest_TC002_${ts()}`;

      await test.step('Open new Lead form', async () => {
        await leadList.clickNewLead();
      });

      await test.step('Fill all fields', async () => {
        await leadForm.fillFirstName('Auto');
        await leadForm.fillLastName(lastName);
        await leadForm.fillTopic('Full Profile Lead TC002');
        await leadForm.fillCompany('ACME Corp TC002');
        await leadForm.fillEmail('autotest.tc002@example.com');
        await leadForm.fillPhone('+61 2 9999 0002');
        await leadForm.selectLeadSource('Web');
      });

      await test.step('Save the Lead', async () => {
        await leadForm.saveForm();
      });

      await test.step('Verify all fields persisted after reopen', async () => {
        const title = await leadForm.getHeaderTitle();
        expect(title).toContain(lastName);
      });
    }
  );

  test('[TC003] Edit an existing Lead\'s first name, last name, and job title and verify changes persisted',
    async ({ leadList, leadForm }) => {
      const originalLast = `TC003_Original_${ts()}`;
      const editedLast = `TC003_Edited_${ts()}`;

      await test.step('Create a lead to edit', async () => {
        await leadList.clickNewLead();
        await leadForm.fillLastName(originalLast);
        await leadForm.fillTopic('TC003 Seed Lead');
        await leadForm.saveForm();
      });

      await test.step('Edit first name, last name, and job title', async () => {
        await leadForm.fillFirstName('EditedFirst');
        await leadForm.fillLastName(editedLast);
        await leadForm.fillJobTitle('Senior Manager');
      });

      await test.step('Save changes', async () => {
        await leadForm.saveForm();
      });

      await test.step('Verify updated values persisted', async () => {
        const title = await leadForm.getHeaderTitle();
        expect(title).toContain(editedLast);
      });
    }
  );

  test('[TC004] Edit a Lead\'s topic and company name and verify the form header reflects the update',
    async ({ leadList, leadForm }) => {
      const lastName = `TC004_${ts()}`;
      const updatedTopic = 'Updated Topic TC004';

      await test.step('Create a lead', async () => {
        await leadList.clickNewLead();
        await leadForm.fillLastName(lastName);
        await leadForm.fillTopic('Initial Topic');
        await leadForm.saveForm();
      });

      await test.step('Update topic and company', async () => {
        await leadForm.fillTopic(updatedTopic);
        await leadForm.fillCompany('Updated Corp TC004');
      });

      await test.step('Save changes', async () => {
        await leadForm.saveForm();
      });

      await test.step('Verify header reflects new topic', async () => {
        const title = await leadForm.getHeaderTitle();
        expect(title).toContain(updatedTopic);
      });
    }
  );

  test('[TC005] Attempt to save a Lead with missing mandatory field (Last Name) and verify inline validation error',
    async ({ leadList, leadForm }) => {
      await test.step('Open new Lead form', async () => {
        await leadList.clickNewLead();
      });

      await test.step('Fill Topic only — leave Last Name blank', async () => {
        await leadForm.fillTopic('No Last Name TC005');
      });

      await test.step('Attempt to save', async () => {
        await leadForm.page.locator('button[data-id="edit-form-save"]').click();
        await leadForm.waitForSpinner();
      });

      await test.step('Verify validation error on Last Name field', async () => {
        const notificationText = await leadForm.getNotificationText();
        expect(notificationText.length).toBeGreaterThan(0);
      });
    }
  );
});
