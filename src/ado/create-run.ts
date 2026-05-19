import * as fs from 'fs';
import * as path from 'path';
import { getTestApi, getTestPlanApi } from './ado.client';
import { config } from '../config/env';
import type { AdoCaseMap, RunContext, TestResultMapping } from '../types';

async function main(): Promise<void> {
  const mapPath = path.join('results', 'ado-case-map.json');
  if (!fs.existsSync(mapPath)) {
    throw new Error(`ado-case-map.json not found. Run 'npm run upload-cases' first.`);
  }

  const caseMap: AdoCaseMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  const testApi = await getTestApi();
  const testPlanApi = await getTestPlanApi();

  // Create the test run
  const run = await testApi.createTestRun(
    {
      name: `D365 Lead Management — Automated Run ${new Date().toISOString()}`,
      plan: { id: config.adoPlanId },
      isAutomated: true,
      state: 'InProgress',
      buildPlatform: 'Any',
      buildFlavor: 'Release',
    },
    config.adoProject
  );
  const runId = run.id!;
  console.log(`✓ Test run created: ID=${runId} "${run.name}"`);

  // Get test points to map workItemId → pointId
  const points = await testPlanApi.getPointsList(
    config.adoProject,
    config.adoPlanId,
    config.adoSuiteId
  );

  const pointByWorkItemId = new Map<number, number>();
  for (const point of points) {
    if (point.testCase?.id && point.id) {
      pointByWorkItemId.set(Number(point.testCase.id), point.id);
    }
  }

  // Create initial InProgress results for all test cases
  const resultCreateModels = Object.entries(caseMap).map(([tcId, { adoWorkItemId, title }]) => ({
    testCase: { id: adoWorkItemId.toString() },
    testCaseName: `[${tcId}] ${title}`,
    testRun: { id: runId.toString() },
    state: 'InProgress',
    outcome: 'None',
    ...(pointByWorkItemId.has(adoWorkItemId)
      ? { testPoint: { id: pointByWorkItemId.get(adoWorkItemId)!.toString() } }
      : {}),
  }));

  const createdResults = await testApi.addTestResultsToTestRun(
    resultCreateModels,
    config.adoProject,
    runId
  );

  // Build the run context
  const resultMappings: TestResultMapping[] = createdResults.map((r, i) => {
    const tcId = Object.keys(caseMap)[i];
    const { adoWorkItemId } = caseMap[tcId];
    return {
      tcId,
      adoWorkItemId,
      adoTestCaseResultId: r.id!,
      adoTestPointId: pointByWorkItemId.get(adoWorkItemId) ?? 0,
    };
  });

  const runContext: RunContext = {
    runId,
    planId: config.adoPlanId,
    suiteId: config.adoSuiteId,
    results: resultMappings,
  };

  const contextPath = path.join('results', 'run-context.json');
  fs.writeFileSync(contextPath, JSON.stringify(runContext, null, 2));
  console.log(`✓ Run context saved → ${contextPath}`);
  console.log(`  runId=${runId}, ${resultMappings.length} result slots created`);
}

main().catch((err) => {
  console.error('create-run failed:', err);
  process.exit(1);
});
