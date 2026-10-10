param([switch]$StartApp, [ValidateSet('local','remote-dev')][string]$Target = 'local')
$ErrorActionPreference = 'Stop'
Write-Host 'CivicSync development setup' -ForegroundColor Cyan
if ($Target -eq 'local') { node scripts/dev-preflight.mjs } else { if ($env:CIVICSYNC_REMOTE_TARGET -ne 'development') { throw 'Remote setup is refused unless CIVICSYNC_REMOTE_TARGET=development is explicitly set for this process.' }; node scripts/dev-preflight.mjs --allow-hosted }
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) { throw 'Supabase CLI is required. Install it and ensure it is on PATH.' }
if ($Target -eq 'local') { supabase start; supabase db push --local } else { if (-not $env:CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS) { throw 'Remote development migrations require CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS=1.' }; supabase db push }
& powershell -ExecutionPolicy Bypass -File ./scripts/dev-seed.ps1 -Target $Target
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
