import * as fs from 'fs';
import * as path from 'path';
import { JsonPatchDocument } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { TEST_CASES } from '../../test-data/test-cases';
import { getWitApi, getTestPlanApi } from './ado.client';
import { config } from '../config/env';
import type { AdoCaseMap } from '../types';

function buildStepsXml(steps: { action: string; expectedResult: string }[]): string {
  const stepElements = steps
    .map(
      (s, i) => `
    <step id="${i + 2}" type="ActionStep">
      <parameterizedString isformatted="true"><![CDATA[${s.action}]]></parameterizedString>
      <parameterizedString isformatted="true"><![CDATA[${s.expectedResult}]]></parameterizedString>
      <description/>
    </step>`
    )
    .join('');
  return `<steps id="0" last="${steps.length + 1}">${stepElements}</steps>`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const mapPath = path.join('results', 'ado-case-map.json');

  if (fs.existsSync(mapPath)) {
    console.log(`ado-case-map.json already exists — skipping upload (delete it to re-upload)`);
    return;
  }

  const witApi = await getWitApi();
  const testPlanApi = await getTestPlanApi();
  const caseMap: AdoCaseMap = {};

  console.log(`Uploading ${TEST_CASES.length} test cases to ADO...`);

  for (const tc of TEST_CASES) {
    const document: JsonPatchDocument = [
      { op: 'add', path: '/fields/System.Title', value: `[${tc.id}] ${tc.title}` },
      { op: 'add', path: '/fields/Microsoft.VSTS.TCM.Steps', value: buildStepsXml(tc.steps) },
      { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: tc.priority },
      { op: 'add', path: '/fields/System.Tags', value: `automation; ${tc.area}; ${tc.id}` },
    ];

    const workItem = await witApi.createWorkItem(
      null,
      document,
      config.adoProject,
      'Test Case'
    );

    const workItemId = workItem.id!;
    caseMap[tc.id] = { adoWorkItemId: workItemId, title: tc.title };
    console.log(`  ✓ ${tc.id} → WI #${workItemId}`);

    // Add to suite
    await testPlanApi.addTestCasesToSuite(
      config.adoProject,
      config.adoPlanId,
      config.adoSuiteId,
      workItemId.toString()
    );

    await sleep(500);
  }

  fs.mkdirSync('results', { recursive: true });
  fs.writeFileSync(mapPath, JSON.stringify(caseMap, null, 2));
  console.log(`\n✓ All test cases uploaded. Map saved → ${mapPath}`);
}

main().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
