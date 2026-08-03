$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$fixtureRoot = (Resolve-Path (Join-Path $projectRoot "../../Protocol/contracts/bag/fixtures")).Path
$tempRoot = Join-Path $PSScriptRoot (".temp-bag-sync-" + [Guid]::NewGuid().ToString("N"))

$bagUi = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "assets/ui/bag/bagUI.ls") | ConvertFrom-Json
$itemList = @($bagUi.'_$child') | Where-Object { $_.name -eq "itemList" } | Select-Object -First 1
if ($null -eq $itemList) { throw "Bag UI itemList is missing" }
if (($itemList.'_templateNode'.'_$ref' -ne "bag-item-template") -or
    ($itemList.'_templateNode'.'_$tmpl' -ne "itemTemplate")) {
    throw "Bag UI itemList must declare its pooled item template"
}
if ($itemList.layout.type -ne 3) { throw "Bag UI itemList must use FlowX layout for multi-row wrapping" }
if ($itemList.scroller.direction -ne 0) { throw "Bag UI itemList scroller must be vertical" }

$itemView = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "assets/ui/common/ItemView.lh") | ConvertFrom-Json
$itemChildren = @($itemView.'_$child')
$qualityIndex = -1
$iconIndex = -1
for ($index = 0; $index -lt $itemChildren.Count; $index++) {
    if ($itemChildren[$index].name -eq "qualityBackground") { $qualityIndex = $index }
    if ($itemChildren[$index].name -eq "icon") { $iconIndex = $index }
}
if ($qualityIndex -lt 0 -or $iconIndex -le $qualityIndex) {
    throw "ItemView icon must render above its quality background"
}
if ($itemChildren[$iconIndex].fitMode -ne 2) { throw "ItemView icon must use LoaderFitMode.Contain" }
$itemViewController = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "src/logic/ui/ItemViewController.ts")
if ($itemViewController -match '_icon\.url') { throw "LayaAir 3 GLoader icons must use src, not url" }
if ($itemViewController -notmatch '_icon\.src = data\.iconPath') { throw "ItemView must assign iconPath to GLoader.src" }

$victoryUi = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "assets/ui/battlescene/BattleVictoryView.ls") | ConvertFrom-Json
$rewardPanel = @($victoryUi.'_$child') | Where-Object { $_.name -eq "rewardPanel" } | Select-Object -First 1
$rewardList = @($rewardPanel.'_$child') | Where-Object { $_.name -eq "rewardList" } | Select-Object -First 1
$rewardTemplate = @($rewardList.'_$child') | Select-Object -First 1
if ($rewardTemplate.height -ne 112) { throw "Victory reward items must use the icon-only 112px slot height" }
if (@($rewardTemplate.'_$child' | Where-Object { $_.name -eq "rewardName" }).Count -ne 0) {
    throw "Victory rewards must not render item names below icons"
}

try {
    Push-Location $projectRoot
    & npx.cmd tsc tools/tests/BagSync.test.ts engine/types/LayaAir.d.ts engine/types/MyDeclear.d.ts `
        --target ES2020 `
        --module commonjs `
        --moduleResolution node `
        --strict `
        --skipLibCheck `
        --outDir $tempRoot `
        --pretty false
    if ($LASTEXITCODE -ne 0) { throw "Bag sync test compilation failed with exit code $LASTEXITCODE" }

    & node (Join-Path $tempRoot "tools/tests/BagSync.test.js") $fixtureRoot
    if ($LASTEXITCODE -ne 0) { throw "Bag sync test failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
    if ([System.IO.Directory]::Exists($tempRoot)) {
        [System.IO.Directory]::Delete($tempRoot, $true)
    }
}
