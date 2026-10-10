param([ValidateSet('local','remote-dev')][string]$Target = 'local')
$ErrorActionPreference = 'Stop'; if ($Target -eq 'local') { node scripts/dev-preflight.mjs } else { node scripts/dev-preflight.mjs --allow-hosted }; if ($LASTEXITCODE -ne 0) { throw 'Verification preflight failed; application readiness was not checked.' }
try { $health = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -Method Get -TimeoutSec 15 } catch { throw 'Application health endpoint is unavailable. Start npm run dev first.' }
if (-not $health.ok) { $health | ConvertTo-Json -Depth 8; throw 'CivicSync readiness check failed.' }
Write-Host 'CivicSync readiness: OK' -ForegroundColor Green
Write-Host ('Database: ' + $health.database)
Write-Host ('Missing relations: ' + (($health.missingRelations -join ', ') -or 'none'))
Write-Host ('Relation errors: ' + (($health.relationErrors.PSObject.Properties.Name -join ', ') -or 'none'))
