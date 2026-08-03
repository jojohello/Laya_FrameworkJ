$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$tempRoot = Join-Path $PSScriptRoot (".temp-scene-camera-" + [Guid]::NewGuid().ToString("N"))

try {
    Push-Location $projectRoot
    & npx.cmd tsc tools/tests/SceneCameraState.test.ts `
        --target ES2020 `
        --module commonjs `
        --moduleResolution node `
        --strict `
        --skipLibCheck `
        --outDir $tempRoot `
        --pretty false
    if ($LASTEXITCODE -ne 0) {
        throw "Scene camera state test compilation failed with exit code $LASTEXITCODE"
    }

    & node (Join-Path $tempRoot "tools/tests/SceneCameraState.test.js")
    if ($LASTEXITCODE -ne 0) {
        throw "Scene camera state test failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
    if ([System.IO.Directory]::Exists($tempRoot)) {
        [System.IO.Directory]::Delete($tempRoot, $true)
    }
}
