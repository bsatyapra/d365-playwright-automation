import * as fs from 'fs';
import * as path from 'path';
import { getTestApi } from './ado.client';
import { config } from '../config/env';
import type { RunContext } from '../types';

async function main(): Promise<void> {
  const contextPath = path.join('results', 'run-context.json');
  if (!fs.existsSync(contextPath)) throw new Error(`run-context.json not found`);

  const runContext: RunContext = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
  const testApi = await getTestApi();

  await testApi.updateTestRun(
    { state: 'Completed' },
    config.adoProject,
    runContext.runId
  );

  console.log(`✓ Test run ${runContext.runId} marked as Completed`);
}

main().catch((err) => {
  console.error('close-run failed:', err);
  process.exit(1);
});
