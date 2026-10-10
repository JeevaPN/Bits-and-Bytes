param([switch]$StartApp, [ValidateSet('auto','local','remote-dev')][string]$Target = 'auto')
$ErrorActionPreference = 'Stop'
$env:SUPABASE_TELEMETRY_DISABLED = '1'
. ./scripts/import-env.ps1
Import-CivicSyncEnvironment
Write-Host 'CivicSync development setup' -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File ./scripts/ensure-project-deps.ps1
if ($LASTEXITCODE -ne 0) { throw 'Project dependency installation failed. Setup stopped before database operations.' }
if ($Target -eq 'auto') {
  $urlLine = Get-Content .env.local,.env -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\s*NEXT_PUBLIC_SUPABASE_URL\s*=' } | Select-Object -First 1
  if ($urlLine -match 'localhost|127\.0\.0\.1') { $Target = 'local' } else { $Target = 'remote-dev' }
}
if ($Target -eq 'local') { node scripts/dev-preflight.mjs } else { if ($env:CIVICSYNC_REMOTE_TARGET -ne 'development') { throw 'Hosted setup refused before any database operation. Set CIVICSYNC_REMOTE_TARGET=development and verify CIVICSYNC_REMOTE_PROJECT_REF from the Supabase dashboard URL.' }; node scripts/dev-preflight.mjs --allow-hosted }
if ($LASTEXITCODE -ne 0) { throw 'Setup preflight failed. No Supabase CLI database operation was attempted.' }
& npx.cmd --no-install supabase --version
if ($LASTEXITCODE -ne 0) { throw 'The project-local Supabase CLI could not start. Run npm install and check Node.js 20+; no global CLI or package manager is required.' }
if ($Target -eq 'local') { & npx.cmd --no-install supabase start; if ($LASTEXITCODE -ne 0) { throw 'Local Supabase could not start. Ensure Docker Desktop is running, then rerun npm run dev:setup.' }; & npx.cmd --no-install supabase db push --local } else { if (-not $env:CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS) { throw 'Remote development migrations require CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS=1.' }; & npx.cmd --no-install supabase db push --linked }
if ($LASTEXITCODE -ne 0) { throw 'Database migrations failed. Review the migration conflict/error above; no destructive repair was attempted.' }
if ($Target -eq 'local') { & npx.cmd --no-install supabase db query --local --file supabase/verify.sql } else { & npx.cmd --no-install supabase db query --linked --file supabase/verify.sql }
if ($LASTEXITCODE -ne 0) { throw 'Database migration history completed, but CivicSync schema/read-model verification failed. Setup stopped before seeding or app startup.' }
& powershell -ExecutionPolicy Bypass -File ./scripts/dev-seed.ps1 -Target $Target
if ($LASTEXITCODE -ne 0) { throw 'Development seed failed. Setup stopped and the application was not started.' }
node scripts/create-demo-accounts.mjs
if ($LASTEXITCODE -ne 0) { throw 'Demo account setup failed. The application was not started.' }
if ($StartApp) {
  Write-Host 'Setup complete. Starting CivicSync and waiting for readiness.' -ForegroundColor Green
  $process = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev') -NoNewWindow -PassThru
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) { Start-Sleep -Seconds 1; try { $health = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -TimeoutSec 2; if ($health.ok) { $ready = $true; break } } catch {} }
  if (-not $ready) { if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }; throw 'CivicSync started but readiness did not pass. Run npm run dev:verify for diagnostics.' }
  Write-Host 'CivicSync readiness: OK' -ForegroundColor Green
  Wait-Process -Id $process.Id
  exit $process.ExitCode
} else { Write-Host 'Setup complete. Run npm run dev to start CivicSync.' -ForegroundColor Green }
