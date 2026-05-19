import { test as base, expect } from '@playwright/test';
import { LeadListPage } from '../pages/LeadListPage';
import { LeadFormPage } from '../pages/LeadFormPage';
import { LeadQualifyDialog } from '../pages/LeadQualifyDialog';
import { AssignDialog } from '../pages/AssignDialog';
import { ActivityPage } from '../pages/ActivityPage';

type D365Fixtures = {
  leadList: LeadListPage;
  leadForm: LeadFormPage;
  qualifyDialog: LeadQualifyDialog;
  assignDialog: AssignDialog;
  activityPage: ActivityPage;
};

export const test = base.extend<D365Fixtures>({
  leadList: async ({ page }, use) => {
    await use(new LeadListPage(page));
  },
  leadForm: async ({ page }, use) => {
    await use(new LeadFormPage(page));
  },
  qualifyDialog: async ({ page }, use) => {
    await use(new LeadQualifyDialog(page));
  },
  assignDialog: async ({ page }, use) => {
    await use(new AssignDialog(page));
  },
  activityPage: async ({ page }, use) => {
    await use(new ActivityPage(page));
  },
});

export { expect };
