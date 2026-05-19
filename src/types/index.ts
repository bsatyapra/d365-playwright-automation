export interface TestStep {
  action: string;
  expectedResult: string;
}

export interface TestCaseDefinition {
  id: string;
  title: string;
  area: 'create-edit' | 'qualify' | 'assignment' | 'activities';
  priority: 1 | 2 | 3 | 4;
  steps: TestStep[];
  adoWorkItemId?: number;
  adoTestPointId?: number;
}

export interface TestResultMapping {
  tcId: string;
  adoWorkItemId: number;
  adoTestCaseResultId: number;
  adoTestPointId: number;
}

export interface RunContext {
  runId: number;
  planId: number;
  suiteId: number;
  results: TestResultMapping[];
}

export interface PlaywrightTestOutcome {
  tcId: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  screenshotPath?: string;
  videoPath?: string;
  errorMessage?: string;
  durationMs: number;
}

export interface AdoCaseMap {
  [tcId: string]: {
    adoWorkItemId: number;
    title: string;
  };
}

export interface FrameworkConfig {
  d365Url: string;
  d365Username: string;
  d365Password: string;
  adoOrgUrl: string;
  adoProject: string;
  adoPat: string;
  adoPlanId: number;
  adoSuiteId: number;
}
