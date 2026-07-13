$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$extensions = @(
    ".java", ".xml", ".properties", ".sql", ".md", ".yaml", ".yml",
    ".json", ".ps1", ".sh", ".bat", ".cmd", ".txt", ".conf", ".csv"
)
$fileNames = @(".editorconfig", ".gitattributes", ".gitignore")

$files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $_.FullName -notmatch "[\\/](\.git|\.qoder|target|output|logs)[\\/]" -and
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

Write-Host "Normalized $changed of $($files.Count) Server text files to UTF-8 without BOM and LF."
