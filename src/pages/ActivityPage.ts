import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ActivityPage extends BasePage {
  private timeline = this.page.locator('[data-id="TimeLine"], [data-id="notescontrol"], .timeline-wrapper').first();

  async waitForTimeline(): Promise<void> {
    await this.timeline.waitFor({ state: 'visible' });
  }

  async openNewActivity(type: 'Task' | 'Phone Call' | 'Email'): Promise<void> {
    const addBtn = this.timeline.locator('button[aria-label*="Add"], button[title*="Add activity"], [data-id*="addActivity"]').first();
    await addBtn.click();
    await this.page.locator(`[aria-label="${type}"], [role="menuitem"]:has-text("${type}")`).first().click();
    await this.waitForSpinner();
  }

  async addTask(subject: string, dueDate: string, priority: string): Promise<void> {
    await this.openNewActivity('Task');
    const panel = this.page.locator('[data-id*="quickCreate"], [aria-label*="Quick Create"]').first();
    await panel.locator('[data-id*="subject"] input, [data-id="subject"] input').first().fill(subject);
    await panel.locator('[data-id*="scheduledend"] input, [data-id="scheduledend"] input').first().fill(dueDate);
    await panel.locator('[data-id*="prioritycode"] select, [data-id="prioritycode"] select').first().selectOption({ label: priority });
    await panel.locator('button[aria-label="Save"], button:has-text("Save")').first().click();
    await this.waitForSpinner();
  }

  async addPhoneCall(subject: string, direction: 'Inbound' | 'Outbound'): Promise<void> {
    await this.openNewActivity('Phone Call');
    const panel = this.page.locator('[data-id*="quickCreate"], [aria-label*="Quick Create"]').first();
    await panel.locator('[data-id*="subject"] input, [data-id="subject"] input').first().fill(subject);
    await panel.locator(`[data-id*="directioncode"] input[aria-label="${direction}"]`).first().click().catch(() => {});
    await panel.locator('button[aria-label="Save"], button:has-text("Save")').first().click();
    await this.waitForSpinner();
  }

  async addEmail(subject: string, toAddress: string): Promise<void> {
    await this.openNewActivity('Email');
    const form = this.page.locator('[data-id*="Email"], form').first();
    await form.locator('[data-id*="subject"] input').first().fill(subject);
    await form.locator('[data-id*="to"] input').first().fill(toAddress);
    await this.page.keyboard.press('Tab');
    await this.page.locator('button[aria-label="Send"], button:has-text("Send")').first().click();
    await this.waitForSpinner();
  }

  async getTimelineItemCount(): Promise<number> {
    const items = this.timeline.locator('[data-id*="timeline-item"], .timeline-item, [role="listitem"]');
    return items.count();
  }

  async isActivityInTimeline(subject: string): Promise<boolean> {
    const item = this.timeline.locator(`*:has-text("${subject}")`).first();
    return item.isVisible({ timeout: 10000 }).catch(() => false);
  }

  async markTaskComplete(subject: string): Promise<void> {
    const taskItem = this.timeline.locator(`*:has-text("${subject}")`).first();
    const completeBtn = taskItem.locator('button[aria-label*="Mark Complete"], [title*="Mark Complete"], button[aria-label*="Complete"]').first();
    await completeBtn.click();
    await this.waitForSpinner();
  }

  async getActivityStatusInTimeline(subject: string): Promise<string> {
    const item = this.timeline.locator(`*:has-text("${subject}")`).first();
    return (await item.locator('[class*="status"], [data-id*="status"]').first().textContent()) ?? '';
  }
}
