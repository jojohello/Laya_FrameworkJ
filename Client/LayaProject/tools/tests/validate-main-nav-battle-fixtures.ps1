$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$repoRoot = (Resolve-Path (Join-Path $projectRoot "../..")).Path

$uiManager = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "src/logic/ui/UIManager.ts")
$routeRegistry = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "src/logic/mainScene/MainNavRouteRegistry.ts")
$mainScene = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "src/logic/mainScene/MainSceneView.ts")
$battleScene = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "src/logic/battleScene/BattleScene.ts")

if ($uiManager -notmatch 'public closeLayer\(layerName: string, exceptName: string = ""\)') {
    throw "UIManager must expose semantic-layer closing"
}
if ($routeRegistry -notmatch 'case "main\.world":[\s\S]*case "battle\.stage":[\s\S]*this\.closeMainContent\(\)') {
    throw "World and battle-stage routes must close MainContent"
}
if ($mainScene -notmatch 'MainNavRouteRegistry\.closeMainContent\(\);\s*void SceneMgr\.instance\.switchScene\(SceneType\.BattleStageScene\)') {
    throw "Direct battle-stage navigation must close MainContent before switching scenes"
}

$characters = Import-Csv -Encoding UTF8 (Join-Path $repoRoot "Config/csv/Character.csv")
$soldierTypes = @{}
foreach ($row in $characters) {
    if ($row.ID -match '^\d+$') { $soldierTypes[[int]$row.ID] = $row.soldierType }
}
if ($soldierTypes[1001] -ne "warrior" -or $soldierTypes[1002] -ne "mage" -or $soldierTypes[1003] -ne "priest") {
    throw "Battle fixture Character IDs no longer map to warrior/mage/priest"
}

$requiredRows = @(
    'configId: 1001, count: 100, startY: 200',
    'configId: 1001, count: 30, startY: 919',
    'configId: 1002, count: 20, startY: 1054',
    'configId: 1003, count: 10, startY: 1144',
    'configId: 1001, count: 1, startY: 300',
    'configId: 1001, count: 1, startY: 964',
    'configId: 1002, count: 1, startY: 1054',
    'configId: 1003, count: 1, startY: 1144'
)
foreach ($row in $requiredRows) {
    if (-not $battleScene.Contains($row)) { throw "Battle fixture row missing: $row" }
}
if ($battleScene -notmatch 'this\._stageCopyType = stage\.copyType === "boss" \? "boss" : "normal"') {
    throw "Battle fixture selection must derive from BattleStage.copyType"
}

Write-Host "Main navigation and battle fixture validation passed."
