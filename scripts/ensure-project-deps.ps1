$ErrorActionPreference = 'Stop'

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw 'Node.js/npm is required. Install Node.js 20+ from the official Node.js installer, then rerun npm run dev:setup.'
}

if (-not (Test-Path './node_modules/supabase/package.json')) {
  Write-Host 'Project dependencies are incomplete; installing the locked npm dependencies...' -ForegroundColor Yellow
  & npm.cmd install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'npm install failed. Fix the npm error above and rerun npm run dev:setup.' }
}
