param([ValidateSet('local','remote-dev')][string]$Target = 'local')
$ErrorActionPreference = 'Stop'; node scripts/dev-preflight.mjs --allow-hosted
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) { throw 'Supabase CLI is required. Install it and ensure it is on PATH.' }
if ($Target -eq 'local') { supabase db push --local } else { if (-not $env:CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS) { throw 'Set CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS=1 explicitly.' }; supabase db push }
