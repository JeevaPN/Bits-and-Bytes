param([ValidateSet('auto','local','remote-dev')][string]$Target = 'auto')
$ErrorActionPreference = 'Stop'; . ./scripts/import-env.ps1; Import-CivicSyncEnvironment; if ($Target -eq 'auto') { if ($env:NEXT_PUBLIC_SUPABASE_URL -match 'localhost|127\.0\.0\.1') { $Target = 'local' } else { $Target = 'remote-dev' } }; if ($Target -eq 'local') { node scripts/dev-preflight.mjs } else { node scripts/dev-preflight.mjs --allow-hosted }; if ($LASTEXITCODE -ne 0) { throw 'Verification preflight failed; application readiness was not checked.' }
try { $health = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -Method Get -TimeoutSec 15 } catch { $statusCode = $_.Exception.Response.StatusCode.value__; if ($statusCode -eq 404) { throw 'The running Next.js process returned 404 for /api/health. Stop it, restart npm run dev, and retry so the current route is compiled.' }; throw 'Application health endpoint is unavailable. Start or restart npm run dev first.' }
if (-not $health.ok) { $health | ConvertTo-Json -Depth 8; throw 'CivicSync readiness check failed.' }
Write-Host 'CivicSync readiness: OK' -ForegroundColor Green
Write-Host ('Database: ' + $health.database)
Write-Host ('Missing relations: ' + (($health.missingRelations -join ', ') -or 'none'))
Write-Host ('Relation errors: ' + (($health.relationErrors.PSObject.Properties.Name -join ', ') -or 'none'))
