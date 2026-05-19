# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**npm and npx are not available from the Bash tool** on this Windows machine. Ask the user to run them in their PowerShell terminal via `! <command>`.

```powershell
# Install dependencies (run once)
npm install
npx playwright install chromium

# Run all tests
npm test

# Run a single test by TC ID
npx playwright test --grep "TC001"

# Run a specific spec file
npx playwright test tests/lead-create-edit/lead-create-edit.spec.ts

# Run headed (visible browser) for debugging
npm run test:headed

# Interactive UI mode
npm run test:ui

# ADO pipeline scripts (run in order)
npm run upload-cases     # push 20 test case WIs to ADO suite
npm run create-run       # open ADO test run → writes results/run-context.json
npm test                 # execute tests → writes results/playwright-outcomes.json
npm run update-results   # push pass/fail + attach screenshots to ADO
npm run close-run        # mark ADO run Completed

# Generate Allure HTML report (requires Java for allure-commandline)
npm run report

# Full automated cycle
.\scripts\run-full-cycle.ps1
.\scripts\run-full-cycle.ps1 -SkipUpload          # skip ADO case upload
.\scripts\run-full-cycle.ps1 -SkipUpload -HeadedMode -TestFilter "TC001"

# TypeScript check
npx tsc --noEmit
```

## Required `.env` file

Create `.env` in the project root before running anything:

```
D365_URL=https://yourorg.crm.dynamics.com
D365_USERNAME=user@tenant.onmicrosoft.com
D365_PASSWORD=secret
ADO_ORG_URL=https://dev.azure.com/your-org
ADO_PROJECT=YourProject
ADO_PAT=your-pat-here
ADO_PLAN_ID=123
ADO_SUITE_ID=456
D365_ASSIGN_USER=FirstName LastName   # optional — enables TC011–TC014
D365_ASSIGN_TEAM=Team Name            # optional — enables TC012
```

## Architecture

### Data flow (the join key is `TC001`…`TC020`)

```
test-data/test-cases.ts          ← source of truth for all 20 test cases
         ↓ upload-test-cases.ts
results/ado-case-map.json        (tcId → adoWorkItemId)
         ↓ create-run.ts
results/run-context.json         (runId + tcId → adoTestCaseResultId + adoTestPointId)
         ↓ playwright test run
results/playwright-outcomes.json (tcId → status + screenshotPath + videoPath)
         ↓ update-results.ts
ADO: results PATCHED + screenshots attached
```

All three JSON files live in `results/` and are gitignored — they are regenerated each run.

### TC ID naming convention (critical)

Every test title **must** begin with `[TC001]`, `[TC002]`, etc. The custom reporter (`src/reporters/outcomes-reporter.ts`) extracts the ID via `/\[TC(\d{3})\]/` and uses it as the join key to link Playwright results back to ADO. Tests without this prefix are silently ignored by the reporter.

### Page Object Model

All page objects extend `BasePage` (`src/pages/BasePage.ts`), which provides:
- `waitForSpinner()` — polls all three D365 loading indicators
- `saveForm()` — clicks save and throws on error banners
- `navigateToArea(area, subArea)` — D365 sitemap navigation
- `resolveLookup(fieldDataId, searchText)` — fills and resolves D365 lookup fields

**D365 locator strategy** — always use `data-id` attributes (stable across D365 updates):
- Text/lookup inputs: `[data-id*="fieldname"] input`
- Dropdowns: `[data-id*="fieldname"] select` or `[role="option"][aria-label="Value"]`
- Buttons: `button[data-id="id"]` or `button[aria-label="Label"]`
- Grid rows: `[data-id="entity_control-pcf_grid_control_container"] [role="row"]`

### Test fixtures (`src/fixtures/test.fixtures.ts`)

All spec files import `{ test, expect }` from `../../src/fixtures/test.fixtures` — never from `@playwright/test` directly. The fixture injects all page objects (`leadList`, `leadForm`, `qualifyDialog`, `assignDialog`, `activityPage`) as typed parameters.

### Authentication

`tests/globalSetup.ts` performs one-time AAD/SSO login and saves `auth/storageState.json`. All subsequent tests reuse this session — no repeated login. The storageState path is passed to `playwright.config.ts` conditionally (only if the file exists, to allow `npx playwright test --list` without prior auth).

### ADO integration (`src/ado/`)

Uses `azure-devops-node-api` v12 with PAT auth. The client factory (`ado.client.ts`) lazily initialises a single `WebApi` connection. Scripts are standalone `ts-node` entry points — each calls `main().catch(process.exit(1))`.

- `getTestPlanApi()` — for plans/suites/test-case operations
- `getTestApi()` — for runs, results, and file attachments
- `getWitApi()` — for creating Test Case work items

`upload-test-cases.ts` is **idempotent**: it exits early if `results/ado-case-map.json` already exists. Delete this file to force re-upload.

### Reporters

Three reporters run simultaneously:
1. `list` — live console output
2. `./src/reporters/outcomes-reporter` — writes `playwright-outcomes.json`; also renames failure videos to `TC001-failure.webm` for predictable ADO attachment names
3. `allure-playwright` — writes raw JSON to `results/allure-results/` for HTML report generation
4. `html` — Playwright's built-in report to `results/playwright-report/`

### Key constraints

- `workers: 1` — D365 has per-user concurrent session limits; parallel execution causes conflicts
- `retries: 1` — one automatic retry on failure; trace captured on first retry
- Video and screenshot are captured **only on failure** to avoid excessive storage
