function Import-CivicSyncEnvironment {
  param([string]$Root = (Get-Location).Path)

  # Match Node resolution: process environment wins, then .env.local, then .env.
  $processNames = @{}
  foreach ($entry in [Environment]::GetEnvironmentVariables('Process').GetEnumerator()) { $processNames[$entry.Key] = $true }
  $fileNames = @{}
  foreach ($file in @('.env.local', '.env')) {
    $path = Join-Path $Root $file
    if (-not (Test-Path -LiteralPath $path)) { continue }
    foreach ($line in Get-Content -LiteralPath $path) {
      if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
        $name = $Matches[1]
        $value = $Matches[2].Trim()
        if (($value.StartsWith("'") -and $value.EndsWith("'")) -or ($value.StartsWith('"') -and $value.EndsWith('"'))) { $value = $value.Substring(1, $value.Length - 2) }
        if (-not $processNames.ContainsKey($name) -and -not $fileNames.ContainsKey($name)) { Set-Item -Path "Env:$name" -Value $value; $fileNames[$name] = $true }
      }
    }
  }
}
