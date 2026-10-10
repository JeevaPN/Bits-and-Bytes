param([ValidateSet('local','remote-dev')][string]$Target = 'local')
$ErrorActionPreference = 'Stop'
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) { throw 'Supabase CLI is required. Install it and ensure it is on PATH.' }
if ($Target -eq 'remote-dev' -and -not $env:CIVICSYNC_ALLOW_REMOTE_DEV_SEED) { throw 'Remote development seeding requires CIVICSYNC_ALLOW_REMOTE_DEV_SEED=1.' }
if ($Target -eq 'local') { supabase db query --local --file supabase/seed.sql } else { supabase db query --file supabase/seed.sql }
Write-Host 'Deterministic development seed applied. Auth users were not fabricated.' -ForegroundColor Green
