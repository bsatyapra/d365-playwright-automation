import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import type { PlaywrightTestOutcome } from '../types';

export default class OutcomesReporter implements Reporter {
  private outcomes: PlaywrightTestOutcome[] = [];
  private readonly outPath = path.join('results', 'playwright-outcomes.json');

  onTestEnd(test: TestCase, result: TestResult): void {
    const match = test.title.match(/\[TC(\d{3})\]/);
    if (!match) return;
    const tcId = `TC${match[1]}`;

    const screenshot = result.attachments.find((a) => a.name === 'screenshot');
    const video = result.attachments.find((a) => a.name === 'video');

    // Rename video to a predictable name for ADO upload
    let videoPath = video?.path;
    if (videoPath && fs.existsSync(videoPath)) {
      const renamed = path.join(path.dirname(videoPath), `${tcId}-failure.webm`);
      fs.renameSync(videoPath, renamed);
      videoPath = renamed;
    }

    this.outcomes.push({
      tcId,
      title: test.title,
      status: result.status as PlaywrightTestOutcome['status'],
      screenshotPath: screenshot?.path,
      videoPath,
      errorMessage: result.error?.message,
      durationMs: result.duration,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    fs.mkdirSync(path.dirname(this.outPath), { recursive: true });
    fs.writeFileSync(this.outPath, JSON.stringify(this.outcomes, null, 2));
    console.log(`\n✓ Outcomes written → ${this.outPath} (${this.outcomes.length} tests)`);
  }
}
