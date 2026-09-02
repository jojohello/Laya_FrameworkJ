[CmdletBinding()]
param([switch]$RequireServices)

$ErrorActionPreference = "Continue"
$hasFailure = $false

function Show-Result {
    param([string]$Name, [string]$Status, [string]$Detail)
    if ($Status -eq "FAIL") { $script:hasFailure = $true }
    Write-Host ("[{0,-7}] {1,-22} {2}" -f $Status, $Name, $Detail)
}

function Test-LocalPort {
    param([int]$Port)
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $pending = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        if (-not $pending.AsyncWaitHandle.WaitOne(500, $false)) { return $false }
        $client.EndConnect($pending)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
Write-Host "Framework-J development environment check"
Write-Host "Repository: $root"
Write-Host ""

foreach ($tool in @(
    @{ Name = "JDK 21+"; Command = "java"; VersionArg = "-version" },
    @{ Name = "Maven"; Command = "mvn"; VersionArg = "-version" },
    @{ Name = "Node.js"; Command = "node"; VersionArg = "--version" }
)) {
    $command = Get-Command $tool.Command -ErrorAction SilentlyContinue
    if (-not $command) {
        Show-Result $tool.Name "FAIL" "$($tool.Command) was not found"
        continue
    }
    $versionText = (& $command.Source $tool.VersionArg 2>&1 | Out-String).Trim()
    $version = ($versionText -split "\r?\n" | Select-Object -First 1)
    if ($tool.Name -eq "JDK 21+" -and $versionText -match 'version\s+"(?<major>\d+)' -and [int]$Matches.major -lt 21) {
        Show-Result $tool.Name "FAIL" "$version; JDK 21 or newer is required"
    } else {
        Show-Result $tool.Name "PASS" $version
    }
}

foreach ($relative in @(
    "Client/LayaProject/settings/BuildSettings.json",
    "Client/LayaProject/tsconfig.json",
    "Sever/pom.xml",
    "Protocol/message-ids.yaml",
    "Config/csv"
)) {
    if (Test-Path -LiteralPath (Join-Path $root $relative)) {
        Show-Result "Project entry" "PASS" $relative
    } else {
        Show-Result "Project entry" "FAIL" "$relative is missing"
    }
}

foreach ($dependency in @(
    @{ Name = "MySQL"; Port = 3306 },
    @{ Name = "Redis"; Port = 6379 }
)) {
    if (Test-LocalPort $dependency.Port) {
        Show-Result $dependency.Name "PASS" "127.0.0.1:$($dependency.Port) accepts connections"
    } elseif ($RequireServices) {
        Show-Result $dependency.Name "FAIL" "127.0.0.1:$($dependency.Port) is unavailable"
    } else {
        Show-Result $dependency.Name "NOT RUN" "start it before launching servers"
    }
}

foreach ($endpoint in @(
    @{ Name = "Login Server"; Url = "http://127.0.0.1:8081/actuator/health" },
    @{ Name = "Gateway Server"; Url = "http://127.0.0.1:8082/actuator/health" },
    @{ Name = "Central Server"; Url = "http://127.0.0.1:8083/actuator/health" },
    @{ Name = "Game Server"; Url = "http://127.0.0.1:8084/actuator/health" }
)) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 2
        Show-Result $endpoint.Name "PASS" "HTTP $($response.StatusCode)"
    } catch {
        $status = if ($RequireServices) { "FAIL" } else { "NOT RUN" }
        Show-Result $endpoint.Name $status $endpoint.Url
    }
}

Write-Host ""
Write-Host "[MANUAL ] LayaAir IDE 3.3       Run the startup scene, sign in, and confirm the main scene opens"
if ($hasFailure) { exit 1 }
