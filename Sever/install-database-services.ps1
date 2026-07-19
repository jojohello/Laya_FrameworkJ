$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$runtime = Join-Path $root 'output\data\local-databases'
$mysqlExe = Join-Path $runtime 'mysql\bin\mysqld.exe'
$mysqlIni = Join-Path $runtime 'mysql\my.ini'
$redisExe = Join-Path $runtime 'redis\tools\memurai.exe'
$redisConf = Join-Path $runtime 'redis\memurai.conf'

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe -Verb RunAs -Wait -ArgumentList @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', ('"{0}"' -f $MyInvocation.MyCommand.Path)
    )
    exit $LASTEXITCODE
}

if (-not (Test-Path -LiteralPath $mysqlExe)) { throw "Missing MySQL executable: $mysqlExe" }
if (-not (Test-Path -LiteralPath $redisExe)) { throw "Missing Redis executable: $redisExe" }

if (Get-Service -Name LayaMySQL -ErrorAction SilentlyContinue) {
    & sc.exe stop LayaMySQL | Out-Null
    & sc.exe delete LayaMySQL | Out-Null
    Start-Sleep -Seconds 2
}
& $mysqlExe --install LayaMySQL "--defaults-file=$mysqlIni"
if ($LASTEXITCODE -ne 0) { throw "MySQL service registration failed: $LASTEXITCODE" }
& sc.exe config LayaMySQL start= demand | Out-Null
& sc.exe failure LayaMySQL reset= 0 actions= "" | Out-Null

if (Get-Service -Name LayaRedis -ErrorAction SilentlyContinue) {
    & sc.exe stop LayaRedis | Out-Null
    & $redisExe --service-uninstall --service-name LayaRedis | Out-Null
    Start-Sleep -Seconds 2
}
& $redisExe --service-install --service-name LayaRedis $redisConf
if ($LASTEXITCODE -ne 0) { throw "Redis service registration failed: $LASTEXITCODE" }
& sc.exe config LayaRedis start= demand | Out-Null
& sc.exe failure LayaRedis reset= 0 actions= "" | Out-Null

Write-Host 'Services installed with Manual startup:'
Get-CimInstance Win32_Service -Filter "Name='LayaMySQL' OR Name='LayaRedis'" |
    Select-Object Name, State, StartMode, PathName |
    Format-Table -AutoSize
