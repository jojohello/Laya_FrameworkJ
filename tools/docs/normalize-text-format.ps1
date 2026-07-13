$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$extensions = @(
    ".md", ".js", ".ts", ".java", ".json", ".yaml", ".yml", ".csv",
    ".ps1", ".bat", ".cmd", ".xml", ".toml", ".txt", ".html", ".css"
)
$fileNames = @(".editorconfig", ".gitattributes", ".gitignore")

$files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $relative = $_.FullName.Substring($root.Length).TrimStart([char[]]@('\', '/'))
    $relative -notmatch "^(Client[\\/]LayaProject|Sever)[\\/]" -and
    $relative -match "^[^\\/]+$|^(Config|Protocol)[\\/]" -and
    $_.FullName -notmatch "[\\/](\.git|node_modules|target|output|logs|produce|library|temp|bin|release)[\\/]" -and
    (($extensions -contains $_.Extension.ToLowerInvariant()) -or ($fileNames -contains $_.Name))
}

$changed = 0
foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    try {
        $text = $strictUtf8.GetString($bytes)
    } catch {
        throw "Cannot normalize non-UTF-8 file: $($file.FullName)"
    }

    $normalized = $text.TrimStart([char]0xFEFF).Replace("`r`n", "`n").Replace("`r", "`n")
    if ($normalized.Length -gt 0 -and -not $normalized.EndsWith("`n")) {
        $normalized += "`n"
    }

    $output = $utf8NoBom.GetBytes($normalized)
    if (-not [System.Linq.Enumerable]::SequenceEqual([byte[]]$bytes, [byte[]]$output)) {
        [System.IO.File]::WriteAllBytes($file.FullName, $output)
        $changed++
    }
}

Write-Host "Normalized $changed of $($files.Count) Root/Config/Protocol text files."
