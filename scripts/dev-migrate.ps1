param([ValidateSet('local','remote-dev')][string]$Target = 'local')
$ErrorActionPreference = 'Stop'; $env:SUPABASE_TELEMETRY_DISABLED = '1'; & powershell -ExecutionPolicy Bypass -File ./scripts/ensure-project-deps.ps1; node scripts/dev-preflight.mjs --allow-hosted
& npx.cmd --no-install supabase --version
if ($LASTEXITCODE -ne 0) { throw 'The project-local Supabase CLI could not start. Run npm install and check Node.js 20+.' }
if ($Target -eq 'local') { & npx.cmd --no-install supabase db push --local } else { if ($env:CIVICSYNC_REMOTE_TARGET -ne 'development' -or -not $env:CIVICSYNC_REMOTE_PROJECT_REF) { throw 'Set CIVICSYNC_REMOTE_TARGET=development and CIVICSYNC_REMOTE_PROJECT_REF after verifying the hosted target.' }; if (-not $env:CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS) { throw 'Set CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS=1 explicitly.' }; & npx.cmd --no-install supabase db push --linked }
