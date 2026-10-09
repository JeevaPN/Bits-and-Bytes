param(
  [switch]$Install,
  [switch]$OverwriteEnv
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

if ($Install) {
  Write-Host "Installing repository dependencies..."
  npm install
}

if (-not (Test-Path ".env.local") -or $OverwriteEnv) {
  Copy-Item ".env.example" ".env.local" -Force
  Write-Host "Created .env.local from .env.example. Fill server-only values locally; never commit it."
} else {
  Write-Host ".env.local already exists; leaving it unchanged."
}

Write-Host "Neighbourhood setup completed."
Write-Host "Configured service seams: Supabase Auth/database, Resend notifications, Cloudinary evidence storage."
Write-Host "The local mock workflow remains available when these values are blank."
