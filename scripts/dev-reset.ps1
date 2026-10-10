param([ValidateSet('local','remote-dev')][string]$Target = 'local', [switch]$ConfirmReset)
$ErrorActionPreference = 'Stop'
if (-not $ConfirmReset) { throw 'Reset is destructive. Re-run with -ConfirmReset after reviewing the target.' }
if ($Target -ne 'local') { throw 'Remote reset is refused. Use a reviewed disposable-project workflow; this script never resets hosted databases.' }
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) { throw 'Supabase CLI is required. Install it and ensure it is on PATH.' }
supabase db reset --local
& powershell -ExecutionPolicy Bypass -File ./scripts/dev-verify.ps1
