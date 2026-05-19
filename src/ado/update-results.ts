import * as fs from 'fs';
import * as path from 'path';
import { getTestApi } from './ado.client';
import { config } from '../config/env';
import type { RunContext, PlaywrightTestOutcome, TestResultMapping } from '../types';

async function attachFile(
  testApi: Awaited<ReturnType<typeof getTestApi>>,
  runId: number,
  resultId: number,
  filePath: string,
  comment: string
): Promise<void> {
  if (!filePath || !fs.existsSync(filePath)) return;
  const stream = fs.readFileSync(filePath).toString('base64');
  await testApi.createTestResultAttachment(
    {
      stream,
      fileName: path.basename(filePath),
      comment,
      attachmentType: 'GeneralAttachment',
    },
    config.adoProject,
    runId,
    resultId
  );
}

async function main(): Promise<void> {
  const contextPath = path.join('results', 'run-context.json');
  const outcomesPath = path.join('results', 'playwright-outcomes.json');

  if (!fs.existsSync(contextPath)) throw new Error(`run-context.json not found`);
  if (!fs.existsSync(outcomesPath)) throw new Error(`playwright-outcomes.json not found`);

  const runContext: RunContext = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
  const outcomes: PlaywrightTestOutcome[] = JSON.parse(fs.readFileSync(outcomesPath, 'utf-8'));
  const testApi = await getTestApi();

  const resultByTcId = new Map<string, TestResultMapping>(
    runContext.results.map((r) => [r.tcId, r])
  );

  const updates = [];

  for (const outcome of outcomes) {
    const mapping = resultByTcId.get(outcome.tcId);
    if (!mapping) {
      console.warn(`  ⚠ No ADO mapping for ${outcome.tcId} — skipping`);
      continue;
    }

    const adoOutcome =
      outcome.status === 'passed' ? 'Passed' : outcome.status === 'skipped' ? 'NotExecuted' : 'Failed';

    updates.push({
      id: mapping.adoTestCaseResultId,
      outcome: adoOutcome,
      state: 'Completed',
      durationInMs: outcome.durationMs,
      comment: outcome.errorMessage ?? '',
      testRun: { id: runContext.runId.toString() },
    });
  }

  if (updates.length > 0) {
    await testApi.updateTestResults(updates, config.adoProject, runContext.runId);
    console.log(`✓ Updated ${updates.length} test results`);
  }

  // Attach evidence for failures
  for (const outcome of outcomes) {
    if (outcome.status !== 'failed') continue;
    const mapping = resultByTcId.get(outcome.tcId);
    if (!mapping) continue;

    if (outcome.screenshotPath) {
      await attachFile(testApi, runContext.runId, mapping.adoTestCaseResultId, outcome.screenshotPath, 'Failure screenshot');
      console.log(`  📎 Screenshot attached for ${outcome.tcId}`);
    }
    if (outcome.videoPath) {
      await attachFile(testApi, runContext.runId, mapping.adoTestCaseResultId, outcome.videoPath, 'Failure video');
      console.log(`  📎 Video attached for ${outcome.tcId}`);
    }
  }

  console.log('✓ Result update complete');
}

main().catch((err) => {
  console.error('update-results failed:', err);
  process.exit(1);
});
