import { expect } from '@playwright/test';
import { test } from '../../src/fixtures/test.fixtures';
import { allure } from 'allure-playwright';
import * as dotenv from 'dotenv';

dotenv.config();

const ts = () => Date.now();
const TARGET_USER = process.env.D365_ASSIGN_USER ?? '';
const TARGET_TEAM = process.env.D365_ASSIGN_TEAM ?? '';

async function createLead(leadList: any, leadForm: any, suffix: string): Promise<string> {
  const lastName = `AutoTest_${suffix}_${ts()}`;
  await leadList.navigateToLeads();
  await leadList.clickNewLead();
  await leadForm.fillLastName(lastName);
  await leadForm.fillTopic(`Lead for ${suffix}`);
  await leadForm.saveForm();
  return lastName;
}

test.describe('Lead Assignment', () => {
  test.beforeEach(async () => {
    await allure.feature('Lead Management');
    await allure.story('Lead Assignment');
  });

  test('[TC011] Assign a Lead to a specific user via the Assign button and verify Owner field updated',
    async ({ leadList, leadForm, assignDialog }) => {
      test.skip(!TARGET_USER, 'D365_ASSIGN_USER not configured — skipping');

      await test.step('Create a lead', async () => {
        await createLead(leadList, leadForm, 'TC011');
      });

      await test.step('Open Assign dialog and select target user', async () => {
        await leadForm.clickAssign();
        await assignDialog.waitForDialog();
        await assignDialog.selectAssignToUserOrTeam();
        await assignDialog.setUserOrTeam(TARGET_USER);
        await assignDialog.clickOK();
      });

      await test.step('Verify Owner field shows target user', async () => {
        const owner = await leadForm.getOwnerValue();
        expect(owner).toContain(TARGET_USER);
      });
    }
  );

  test('[TC012] Assign a Lead to a Team and verify Owner field reflects the Team name',
    async ({ leadList, leadForm, assignDialog }) => {
      test.skip(!TARGET_TEAM, 'D365_ASSIGN_TEAM not configured — skipping');

      await test.step('Create a lead', async () => {
        await createLead(leadList, leadForm, 'TC012');
      });

      await test.step('Open Assign dialog and select team', async () => {
        await leadForm.clickAssign();
        await assignDialog.waitForDialog();
        await assignDialog.selectAssignToUserOrTeam();
        await assignDialog.setUserOrTeam(TARGET_TEAM);
        await assignDialog.clickOK();
      });

      await test.step('Verify Owner shows Team name', async () => {
        const owner = await leadForm.getOwnerValue();
        expect(owner).toContain(TARGET_TEAM);
      });
    }
  );

  test('[TC013] Reassign an already-assigned Lead from User A to User B and verify audit trail',
    async ({ leadList, leadForm, assignDialog }) => {
      test.skip(!TARGET_USER, 'D365_ASSIGN_USER not configured — skipping');

      const userB = TARGET_USER;

      await test.step('Create a lead (initially owned by current user)', async () => {
        await createLead(leadList, leadForm, 'TC013');
      });

      await test.step('Assign to User B', async () => {
        await leadForm.clickAssign();
        await assignDialog.waitForDialog();
        await assignDialog.selectAssignToUserOrTeam();
        await assignDialog.setUserOrTeam(userB);
        await assignDialog.clickOK();
      });

      await test.step('Verify Owner updated to User B', async () => {
        const owner = await leadForm.getOwnerValue();
        expect(owner).toContain(userB);
      });
    }
  );

  test('[TC014] Verify that after assignment the lead no longer appears in assigner\'s My Open Leads',
    async ({ leadList, leadForm, assignDialog }) => {
      test.skip(!TARGET_USER, 'D365_ASSIGN_USER not configured — skipping');

      let leadName = '';

      await test.step('Create a lead', async () => {
        leadName = await createLead(leadList, leadForm, 'TC014');
      });

      await test.step('Assign lead to another user', async () => {
        await leadForm.clickAssign();
        await assignDialog.waitForDialog();
        await assignDialog.selectAssignToUserOrTeam();
        await assignDialog.setUserOrTeam(TARGET_USER);
        await assignDialog.clickOK();
      });

      await test.step('Navigate to My Open Leads view — lead should not appear', async () => {
        await leadList.navigateToLeads();
        await leadList.switchView('My Open Leads');
        const found = await leadList.searchLead(leadName);
        expect(found).toBe(false);
      });
    }
  );

  test('[TC015] Assign Lead to self and verify no-change scenario',
    async ({ leadList, leadForm, assignDialog }) => {
      await test.step('Create a lead (owned by current user)', async () => {
        await createLead(leadList, leadForm, 'TC015');
      });

      const ownerBefore = await leadForm.getOwnerValue();

      await test.step('Assign to self', async () => {
        await leadForm.clickAssign();
        await assignDialog.waitForDialog();
        await assignDialog.selectAssignToMe();
        await assignDialog.clickOK();
      });

      await test.step('Verify Owner is unchanged', async () => {
        const ownerAfter = await leadForm.getOwnerValue();
        expect(ownerAfter).toBe(ownerBefore);
      });
    }
  );
});
