#Requires -Version 5.1
<#
.SYNOPSIS
  Runs the full D365 Playwright automation cycle end-to-end.

.PARAMETER SkipUpload
  Skip test case upload to ADO (use when already uploaded in a previous run).

.PARAMETER HeadedMode
  Run Playwright tests in headed (visible browser) mode — useful for debugging.

.PARAMETER TestFilter
  Optional Playwright --grep filter (e.g. "TC001" to run one test).

.EXAMPLE
  .\run-full-cycle.ps1
  .\run-full-cycle.ps1 -SkipUpload
  .\run-full-cycle.ps1 -SkipUpload -HeadedMode -TestFilter "TC001"
#>
param(
  [switch]$SkipUpload,
  [switch]$HeadedMode,
  [string]$TestFilter = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$Divider = '─' * 60

function Step-Run {
  param([string]$Name, [scriptblock]$Block)
  Write-Host "`n$Divider" -ForegroundColor DarkGray
  Write-Host "  $Name" -ForegroundColor Cyan
  Write-Host "$Divider" -ForegroundColor DarkGray
  & $Block
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    Write-Host "`n✗ FAILED: $Name (exit $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host "`nD365 Playwright Full Cycle — $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Yellow

# Step 1: Upload test cases
if (-not $SkipUpload) {
  Step-Run 'Step 1: Upload Test Cases to ADO' {
    npm run upload-cases
  }
} else {
  Write-Host "`n[Skipped] Step 1: Upload — using existing ado-case-map.json" -ForegroundColor DarkGray
}

# Step 2: Create ADO test run
Step-Run 'Step 2: Create ADO Test Run' {
  npm run create-run
}

# Step 3: Execute Playwright tests
Step-Run 'Step 3: Execute Playwright Tests' {
  $args = @()
  if ($HeadedMode)  { $args += '--headed' }
  if ($TestFilter)  { $args += '--grep'; $args += $TestFilter }
  npx playwright test @args
}

# Step 4: Update ADO results + attach evidence
Step-Run 'Step 4: Update ADO Test Results & Attach Evidence' {
  npm run update-results
}

# Step 5: Close the test run
Step-Run 'Step 5: Close ADO Test Run' {
  npm run close-run
}

# Step 6: Generate Allure HTML report
Step-Run 'Step 6: Generate Allure HTML Report' {
  npm run report
}

Write-Host "`n$Divider" -ForegroundColor DarkGray
Write-Host "  ✓ Full cycle complete — $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host "$Divider`n" -ForegroundColor DarkGray
