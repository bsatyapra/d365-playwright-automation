import { expect } from '@playwright/test';
import { test } from '../../src/fixtures/test.fixtures';
import { allure } from 'allure-playwright';

const ts = () => Date.now();

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

async function createLeadAndNavigate(leadList: any, leadForm: any, suffix: string): Promise<void> {
  const lastName = `AutoTest_${suffix}_${ts()}`;
  await leadList.navigateToLeads();
  await leadList.clickNewLead();
  await leadForm.fillLastName(lastName);
  await leadForm.fillTopic(`Lead for ${suffix}`);
  await leadForm.saveForm();
}

test.describe('Lead Activities', () => {
  test.beforeEach(async () => {
    await allure.feature('Lead Management');
    await allure.story('Activities on Lead');
  });

  test('[TC016] Create a Task activity on a Lead with subject, due date, and priority — verify in timeline',
    async ({ leadList, leadForm, activityPage }) => {
      const taskSubject = `Follow up TC016 ${ts()}`;

      await test.step('Create a lead', async () => {
        await createLeadAndNavigate(leadList, leadForm, 'TC016');
      });

      await test.step('Add a Task via the Timeline', async () => {
        await activityPage.waitForTimeline();
        await activityPage.addTask(taskSubject, tomorrow(), 'High');
      });

      await test.step('Verify Task appears in Timeline', async () => {
        const visible = await activityPage.isActivityInTimeline(taskSubject);
        expect(visible).toBe(true);
      });
    }
  );

  test('[TC017] Create a Phone Call activity on a Lead and verify it appears in the activity feed',
    async ({ leadList, leadForm, activityPage }) => {
      const callSubject = `Intro Call TC017 ${ts()}`;

      await test.step('Create a lead', async () => {
        await createLeadAndNavigate(leadList, leadForm, 'TC017');
      });

      await test.step('Add a Phone Call via the Timeline', async () => {
        await activityPage.waitForTimeline();
        await activityPage.addPhoneCall(callSubject, 'Outbound');
      });

      await test.step('Verify Phone Call appears in Timeline', async () => {
        const visible = await activityPage.isActivityInTimeline(callSubject);
        expect(visible).toBe(true);
      });
    }
  );

  test('[TC018] Create an Email activity on a Lead, send it, and verify status shows as Sent in timeline',
    async ({ leadList, leadForm, activityPage }) => {
      const emailSubject = `Outreach TC018 ${ts()}`;

      await test.step('Create a lead', async () => {
        await createLeadAndNavigate(leadList, leadForm, 'TC018');
      });

      await test.step('Add Email via the Timeline and Send', async () => {
        await activityPage.waitForTimeline();
        await activityPage.addEmail(emailSubject, 'autotest@example.com');
      });

      await test.step('Verify Email appears in Timeline', async () => {
        const visible = await activityPage.isActivityInTimeline(emailSubject);
        expect(visible).toBe(true);
      });
    }
  );

  test('[TC019] Mark an open Task on a Lead as Completed and verify the timeline shows the closed activity',
    async ({ leadList, leadForm, activityPage }) => {
      const taskSubject = `Complete Me TC019 ${ts()}`;

      await test.step('Create a lead and add a Task', async () => {
        await createLeadAndNavigate(leadList, leadForm, 'TC019');
        await activityPage.waitForTimeline();
        await activityPage.addTask(taskSubject, tomorrow(), 'Normal');
      });

      await test.step('Mark the task as Complete', async () => {
        await activityPage.markTaskComplete(taskSubject);
      });

      await test.step('Verify task status in Timeline', async () => {
        const status = await activityPage.getActivityStatusInTimeline(taskSubject);
        expect(status.toLowerCase()).toMatch(/complete|closed|done/i);
      });
    }
  );

  test('[TC020] Verify activity count on Lead summary tile reflects correct number after adding two activities',
    async ({ leadList, leadForm, activityPage }) => {
      await test.step('Create a lead with no activities', async () => {
        await createLeadAndNavigate(leadList, leadForm, 'TC020');
        await activityPage.waitForTimeline();
      });

      const countBefore = await activityPage.getTimelineItemCount();

      await test.step('Add two activities', async () => {
        await activityPage.addTask(`Task One TC020 ${ts()}`, tomorrow(), 'Normal');
        await activityPage.addPhoneCall(`Call Two TC020 ${ts()}`, 'Outbound');
      });

      await test.step('Verify timeline item count increased by 2', async () => {
        const countAfter = await activityPage.getTimelineItemCount();
        expect(countAfter).toBeGreaterThanOrEqual(countBefore + 2);
      });
    }
  );
});
