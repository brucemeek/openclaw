param(
  [switch]$Enable,
  [switch]$Disable
)

$ErrorActionPreference = "Stop"

$hostEntry = "127.0.0.1 agent.arcanedge.ai"
$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"

if (-not $Enable -and -not $Disable) {
  Write-Host "Usage: toggle-agent-hosts.ps1 -Enable | -Disable"
  exit 1
}

if ($Enable -and $Disable) {
  Write-Host "Pick only one: -Enable or -Disable"
  exit 1
}

if (-not (Test-Path $hostsPath)) {
  Write-Host "Hosts file not found: $hostsPath"
  exit 1
}

$lines = Get-Content -Path $hostsPath -ErrorAction Stop
$hasEntry = $lines | Where-Object { $_.Trim() -eq $hostEntry } | ForEach-Object { $_ }

if ($Enable) {
  if ($hasEntry) {
    Write-Host "Hosts entry already enabled."
    exit 0
  }
  Add-Content -Path $hostsPath -Value $hostEntry -ErrorAction Stop
  Write-Host "Enabled local override for agent.arcanedge.ai"
  exit 0
}

if ($Disable) {
  if (-not $hasEntry) {
    Write-Host "Hosts entry already disabled."
    exit 0
  }
  $filtered = $lines | Where-Object { $_.Trim() -ne $hostEntry }
  Set-Content -Path $hostsPath -Value $filtered -ErrorAction Stop
  Write-Host "Disabled local override for agent.arcanedge.ai"
  exit 0
}
