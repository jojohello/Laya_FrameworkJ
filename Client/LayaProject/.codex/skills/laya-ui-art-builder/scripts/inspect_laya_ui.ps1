param(
    [string]$Root = "."
)

$ErrorActionPreference = "Stop"

$files = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
    $_.Extension -eq ".ls" -or $_.Extension -eq ".lh"
}

foreach ($file in $files) {
    $result = [ordered]@{
        Path = $file.FullName
        Json = "ok"
        Images = 0
        Prefabs = 0
        Runtime = 0
    }

    try {
        $json = Get-Content -Raw -LiteralPath $file.FullName | ConvertFrom-Json
        $text = Get-Content -Raw -LiteralPath $file.FullName
        $result.Images = ([regex]::Matches($text, '"_$type"\s*:\s*"GImage"')).Count
        $result.Prefabs = ([regex]::Matches($text, '"_\$prefab"')).Count
        $result.Runtime = ([regex]::Matches($text, '"_\$runtime"')).Count
    } catch {
        $result.Json = "failed: $($_.Exception.Message)"
    }

    [PSCustomObject]$result
}
