param([ValidateSet('local','remote-dev')][string]$Target = 'local', [switch]$ConfirmReset)
$ErrorActionPreference = 'Stop'
$env:SUPABASE_TELEMETRY_DISABLED = '1'
if (-not $ConfirmReset) { throw 'Reset is destructive. Re-run with -ConfirmReset after reviewing the target.' }
if ($Target -ne 'local') { throw 'Remote reset is refused. Use a reviewed disposable-project workflow; this script never resets hosted databases.' }
& npx.cmd --no-install supabase --version
if ($LASTEXITCODE -ne 0) { throw 'The project-local Supabase CLI could not start. Run npm install and check Node.js 20+.' }
& npx.cmd --no-install supabase db reset --local
if ($LASTEXITCODE -ne 0) { throw 'Local database reset failed.' }
& powershell -ExecutionPolicy Bypass -File ./scripts/dev-verify.ps1
if ($LASTEXITCODE -ne 0) { throw 'Post-reset verification failed.' }
