param([ValidateSet('local','remote-dev')][string]$Target = 'local')
$ErrorActionPreference = 'Stop'
$env:SUPABASE_TELEMETRY_DISABLED = '1'
. ./scripts/import-env.ps1
Import-CivicSyncEnvironment
& powershell -ExecutionPolicy Bypass -File ./scripts/ensure-project-deps.ps1
if ($LASTEXITCODE -ne 0) { throw 'Project dependency installation failed.' }
& npx.cmd --no-install supabase --version
if ($LASTEXITCODE -ne 0) { throw 'The project-local Supabase CLI could not start. Run npm install and check Node.js 20+.' }
if ($Target -eq 'remote-dev' -and -not $env:CIVICSYNC_ALLOW_REMOTE_DEV_SEED) { throw 'Remote development seeding requires CIVICSYNC_ALLOW_REMOTE_DEV_SEED=1.' }
if ($Target -eq 'local') { & npx.cmd --no-install supabase db query --local --file supabase/seed.sql } else { if ($env:CIVICSYNC_REMOTE_TARGET -ne 'development' -or -not $env:CIVICSYNC_REMOTE_PROJECT_REF) { throw 'Set CIVICSYNC_REMOTE_TARGET=development and CIVICSYNC_REMOTE_PROJECT_REF after verifying the hosted target.' }; & npx.cmd --no-install supabase db query --linked --file supabase/seed.sql }
if ($LASTEXITCODE -ne 0) { throw 'Seed command failed; the seed was not reported as applied.' }
Write-Host 'Deterministic development seed applied. Auth users were not fabricated.' -ForegroundColor Green
