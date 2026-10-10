$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
}

Write-Host "CivicSync Neighbourhood verification"
Write-Host "Cleaning generated Next.js output"
if (Test-Path ".next") { Remove-Item -LiteralPath ".next" -Recurse -Force }
Write-Host "1/5 Feature traceability"
Invoke-Checked "npm" @("run", "generate:traceability")
Invoke-Checked "npm" @("run", "validate:traceability")
Write-Host "2/5 Typecheck"
Invoke-Checked "npm" @("run", "typecheck")
Write-Host "3/5 Unit and workflow tests"
Invoke-Checked "npm" @("run", "test")
Write-Host "4/5 Lint"
Invoke-Checked "npm" @("run", "lint")
Write-Host "5/5 Production build"
if (Test-Path ".next") { Remove-Item -LiteralPath ".next" -Recurse -Force }
try {
  Invoke-Checked "npm" @("run", "build")
} catch {
  Write-Warning "The first Next.js build attempt failed; cleaning generated output and retrying once."
  if (Test-Path ".next") { Remove-Item -LiteralPath ".next" -Recurse -Force }
  Invoke-Checked "npm" @("run", "build")
}
Write-Host "Neighbourhood verification completed successfully."
