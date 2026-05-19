# Plan: D365 Lead Management — Playwright + Azure DevOps Full Automation Pipeline

## Context
Build a complete end-to-end test automation framework from scratch in an empty git repo (`C:\Claude\UI`).
Goal: define test cases for D365 Lead Management → upload to an existing ADO Test Plan → run Playwright tests against D365 → push results + screenshot evidence back to ADO → publish Allure HTML report.

---

## Tech Stack
| Layer | Choice |
|---|---|
| Test runner | `@playwright/test` + TypeScript |
| Pattern | Page Object Model (POM) |
| D365 selectors | `data-id` attributes + ARIA roles |
| ADO integration | `azure-devops-node-api` |
| Reporting | `allure-playwright` + custom outcomes reporter |
| Config | `.env` + typed loader |
| Orchestration | PowerShell script |

---

## Project Structure
```
C:\Claude\UI\
├── package.json
├── tsconfig.json
├── playwright.config.ts              # reporters, globalSetup, storageState, video/screenshot
├── .env.example
├── .gitignore
│
├── src/
│   ├── types/index.ts                # All shared TS interfaces
│   ├── config/env.ts                 # Validates .env, exports typed FrameworkConfig
│   │
│   ├── pages/                        # Page Object Model
│   │   ├── BasePage.ts               # D365 helpers: waitForSpinner, saveForm, navigateToArea, resolveLookup
│   │   ├── LoginPage.ts              # AAD/SSO login (globalSetup only)
│   │   ├── LeadListPage.ts           # Lead grid: search, open, clickNewLead
│   │   ├── LeadFormPage.ts           # All lead field setters, qualify, disqualify, assign
│   │   ├── LeadQualifyDialog.ts      # Qualify/Disqualify modal
│   │   ├── AssignDialog.ts           # Assign To dialog (user / team)
│   │   └── ActivityPage.ts           # Task / Phone Call / Email creation + timeline
│   │
│   ├── fixtures/test.fixtures.ts     # Extended test with all page objects injected
│   ├── reporters/outcomes-reporter.ts # Extracts TC IDs + evidence paths → playwright-outcomes.json
│   │
│   ├── helpers/
│   │   ├── d365.helpers.ts           # spinner variants, lookup wait
│   │   └── evidence.helpers.ts       # screenshot/video path normalisation
│   │
│   └── ado/
│       ├── ado.client.ts             # WebApi factory (PAT auth)
│       ├── upload-test-cases.ts      # Create WI + add to suite → writes ado-case-map.json
│       ├── create-run.ts             # Creates ADO run + maps testPoints → writes run-context.json
│       ├── update-results.ts         # PATCH results Passed/Failed + attach screenshots/video
│       └── close-run.ts              # Sets run state = Completed
│
├── tests/
│   ├── globalSetup.ts                # One-time AAD login → saves auth/storageState.json
│   ├── lead-create-edit/lead-create-edit.spec.ts   # TC001–TC005
│   ├── lead-qualify/lead-qualify.spec.ts           # TC006–TC010
│   ├── lead-assignment/lead-assignment.spec.ts     # TC011–TC015
│   └── lead-activities/lead-activities.spec.ts     # TC016–TC020
│
├── test-data/test-cases.ts           # TestCaseDefinition[] — TC001..TC020, source of truth
│
├── results/
│   ├── ado-case-map.json             # Written by upload-test-cases (tcId → adoWorkItemId)
│   ├── run-context.json              # Written by create-run (runId + TestResultMapping[])
│   ├── playwright-outcomes.json      # Written by outcomes-reporter (tcId → status + paths)
│   ├── allure-results/               # Raw Allure output (gitignored)
│   ├── allure-report/                # Generated HTML (gitignored)
│   ├── screenshots/                  # Failure screenshots (gitignored)
│   └── videos/                       # Failure videos (gitignored)
│
├── auth/storageState.json            # Written by globalSetup (gitignored)
└── scripts/run-full-cycle.ps1        # Orchestrator: all 6 steps in sequence
```

---

## Key TypeScript Interfaces (`src/types/index.ts`)

```typescript
interface TestCaseDefinition {
  id: string;                   // "TC001"
  title: string;
  area: 'create-edit' | 'qualify' | 'assignment' | 'activities';
  steps: { action: string; expectedResult: string }[];
  adoWorkItemId?: number;       // injected after upload-test-cases runs
  adoTestPointId?: number;      // injected after create-run runs
}

interface RunContext {
  runId: number;
  planId: number;
  suiteId: number;
  results: TestResultMapping[];
}

interface TestResultMapping {
  tcId: string;
  adoWorkItemId: number;
  adoTestCaseResultId: number;
  adoTestPointId: number;
}

interface PlaywrightTestOutcome {
  tcId: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  screenshotPath?: string;
  videoPath?: string;
  errorMessage?: string;
  durationMs: number;
}

interface FrameworkConfig {
  d365Url: string; d365Username: string; d365Password: string;
  adoOrgUrl: string; adoProject: string; adoPat: string;
  adoPlanId: number; adoSuiteId: number;
}
```

---

## 20 Test Cases

| ID | Area | Title |
|---|---|---|
| TC001 | Create/Edit | Create a new Lead with all mandatory fields and verify it appears in Lead grid |
| TC002 | Create/Edit | Create a Lead with full profile (company, phone, email, source) and verify all fields saved |
| TC003 | Create/Edit | Edit an existing Lead's first name, last name, and job title and verify changes persisted |
| TC004 | Create/Edit | Edit a Lead's topic and company name and verify the form header reflects the update |
| TC005 | Create/Edit | Attempt to save a Lead with missing mandatory field (Last Name) and verify inline validation error |
| TC006 | Qualify | Qualify a Lead and verify it converts to Opportunity, Contact, and Account |
| TC007 | Qualify | Qualify a Lead with only Opportunity selected and verify Contact/Account not created |
| TC008 | Qualify | Disqualify a Lead with reason "No Longer Interested" and verify status changes to Disqualified |
| TC009 | Qualify | Disqualify a Lead with reason "Lost" and verify the Lead is read-only after disqualification |
| TC010 | Qualify | Re-open a Disqualified Lead and verify status returns to Open |
| TC011 | Assignment | Assign a Lead to a specific user via the Assign button and verify Owner field updated |
| TC012 | Assignment | Assign a Lead to a Team and verify Owner field reflects the Team name |
| TC013 | Assignment | Reassign an already-assigned Lead from User A to User B and verify audit trail |
| TC014 | Assignment | Verify that after assignment the newly assigned owner can view the Lead in their queue |
| TC015 | Assignment | Assign Lead to self and verify no-change scenario (owner remains the same user) |
| TC016 | Activities | Create a Task activity on a Lead with subject, due date, and priority — verify in timeline |
| TC017 | Activities | Create a Phone Call activity on a Lead and verify it appears in the activity feed |
| TC018 | Activities | Create an Email activity on a Lead, send it, and verify status shows as Sent in timeline |
| TC019 | Activities | Mark an open Task on a Lead as Completed and verify the timeline shows the closed activity |
| TC020 | Activities | Verify activity count on Lead summary tile reflects correct number after adding two activities |

---

## D365 Locator Strategy (consistent across all pages)

| Element | Selector |
|---|---|
| Text / lookup input | `[data-id*="fieldname"] input` |
| Dropdown option | `[role="option"][aria-label="Value"]` |
| Command bar button | `button[data-id="new-lead"]` or `button[aria-label="Qualify"]` |
| Grid rows | `[data-id="entity_control-pcf_grid_control_container"] [role="row"]` |
| Loading spinner | `[data-id="globalLoadingSpinner"]`, `.progressIndicator`, `[data-id="mscrm_busyIndicator"]` |
| Error toast | `[data-id="notificationWrapper"]` |
| Form header | `[data-id="header_title"]` |

---

## ADO Integration — Data Flow

### Join key = `TC001`…`TC020` flows through 3 files:
```
test-data/test-cases.ts
    ↓ upload-test-cases.ts
results/ado-case-map.json          (tcId → adoWorkItemId)
    ↓ create-run.ts
results/run-context.json           (runId + tcId → adoTestCaseResultId + adoTestPointId)
    ↓ playwright test run
results/playwright-outcomes.json   (tcId → status + screenshotPath + videoPath)
    ↓ update-results.ts
ADO: results PATCHED + attachments uploaded
```

### ADO API calls per script:
| Script | API call |
|---|---|
| upload-test-cases | `witApi.createWorkItem()` → `testPlanApi.addTestCasesToSuite()` |
| create-run | `testPlanApi.getPoints()` → `testApi.createTestRun()` → `testApi.addTestResultsToTestRun()` |
| update-results | `testApi.updateTestResults()` → `testApi.createTestResultAttachment()` |
| close-run | `testApi.updateTestRun(project, runId, { state: 'Completed' })` |

### Evidence flow (screenshot → ADO):
1. Playwright captures failure screenshot → `results/screenshots/TC001-xxx.png`
2. `OutcomesReporter.onTestEnd()` records absolute path in `playwright-outcomes.json`
3. `update-results.ts` base64-encodes file → `createTestResultAttachment()` → visible in ADO result

### TC ID naming convention (critical for mapping):
Every test title MUST start with `[TC001]`:
```typescript
test('[TC001] Create a new Lead with all mandatory fields...', async ({ ... }) => {
```
`OutcomesReporter` extracts via `/\[TC(\d{3})\]/` regex.

---

## Implementation Phases

| Phase | What we build | Critical Files |
|---|---|---|
| 0 | Scaffold: package.json, tsconfig, playwright.config, .env.example, .gitignore | Root config files |
| 1 | Config + Types: env loader, shared interfaces, 20 test case data | `src/config/env.ts`, `src/types/index.ts`, `test-data/test-cases.ts` |
| 2A | Auth: globalSetup → AAD login → storageState | `tests/globalSetup.ts` |
| 2B | BasePage: spinner (3 variants), saveForm, navigateToArea, resolveLookup | `src/pages/BasePage.ts` |
| 2C | All 6 page objects | `src/pages/*.ts` |
| 2D | Custom test fixture | `src/fixtures/test.fixtures.ts` |
| 3 | ADO scripts: client factory + 4 scripts | `src/ado/*.ts` |
| 4 | Evidence bridge: outcomes reporter | `src/reporters/outcomes-reporter.ts` |
| 5 | All 20 test specs with Allure metadata + test.step() | `tests/**/*.spec.ts` |
| 6 | Allure config: categories, env info, ADO links | `playwright.config.ts` allure options |
| 7 | PowerShell orchestrator | `scripts/run-full-cycle.ps1` |
| 8 | Hardening: flakiness fixes, idempotent upload | All pages + ADO scripts |

---

## PowerShell Orchestrator (`scripts/run-full-cycle.ps1`)
```
Step 1: npm run upload-cases     → push 20 WIs to ADO suite   (-SkipUpload to skip)
Step 2: npm run create-run       → open ADO run, write run-context.json
Step 3: npx playwright test      → run 20 tests, write playwright-outcomes.json + allure-results/
Step 4: npm run update-results   → PATCH ADO results + attach screenshots
Step 5: npm run close-run        → mark run Completed
Step 6: npm run report           → allure generate → allure open
```

---

## `.env` Configuration
```
D365_URL=https://yourorg.crm.dynamics.com
D365_USERNAME=user@tenant.onmicrosoft.com
D365_PASSWORD=secret
ADO_ORG_URL=https://dev.azure.com/your-org
ADO_PROJECT=YourProject
ADO_PAT=your-pat-here
ADO_PLAN_ID=123
ADO_SUITE_ID=456
```

---

## Verification Checklist (end-to-end)
- [ ] `npm install` exits 0
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx playwright test --list` shows exactly 20 tests
- [ ] `globalSetup` produces `auth/storageState.json`
- [ ] `npm run upload-cases` → 20 WIs visible in ADO under correct suite
- [ ] `npm run create-run` → run visible in ADO as InProgress
- [ ] `npx playwright test` → `results/playwright-outcomes.json` has 20 entries
- [ ] `npm run update-results` → ADO results show Passed/Failed + screenshot attachments
- [ ] `npm run close-run` → run shows Completed in ADO
- [ ] `npm run report` → Allure HTML opens with steps, screenshots, ADO links
- [ ] `.\scripts\run-full-cycle.ps1 -SkipUpload` completes all 6 steps end-to-end

---

## Hardening Notes
- `workers: 1` in playwright.config — D365 has per-user session limits, data conflicts under parallelism
- Spinner: handle all 3 variants (`globalLoadingSpinner`, `.progressIndicator`, `mscrm_busyIndicator`)
- Lookups: wait for `[aria-label="Lookup results"]` before clicking suggestion
- ADO upload: 500ms delay between WIT creates to avoid HTTP 429
- Idempotent upload: check `ado-case-map.json` exists before re-creating WIs
- Video: only attach on failure; rename from hash to `TC001-failure.webm` before upload
