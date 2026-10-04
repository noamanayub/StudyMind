$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$pgRoot = Join-Path $workspaceRoot '.tools\postgres'
$pgCtl = Join-Path $pgRoot 'bin\pg_ctl.exe'
$dataDir = Join-Path $pgRoot 'data'
if (-not (Test-Path -LiteralPath $pgCtl)) {
  throw 'The workspace-local database is not installed. Follow README.md to use native PostgreSQL or Docker.'
}
& $pgCtl -D $dataDir status
if ($LASTEXITCODE -ne 0) {
  & $pgCtl -D $dataDir -l (Join-Path $pgRoot 'server.log') -o '-p 5433 -h 127.0.0.1' -w start
  if ($LASTEXITCODE -ne 0) { throw 'Local database startup failed. Inspect .tools/postgres/server.log.' }
}
