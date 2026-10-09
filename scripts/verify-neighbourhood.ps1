$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
}

Write-Host "CivicSync Neighbourhood verification"
Write-Host "1/4 Typecheck"
Invoke-Checked "npm" @("run", "typecheck")
Write-Host "2/4 Unit and workflow tests"
Invoke-Checked "npm" @("run", "test")
Write-Host "3/4 Lint"
Invoke-Checked "npm" @("run", "lint")
Write-Host "4/4 Production build"
Invoke-Checked "npm" @("run", "build")
Write-Host "Neighbourhood verification completed successfully."
