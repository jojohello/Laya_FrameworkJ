$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$errors = [System.Collections.Generic.List[string]]::new()
$strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
$extensions = @(
    ".ts", ".js", ".json", ".md", ".yaml", ".yml", ".ps1", ".xml",
    ".toml", ".csv", ".txt", ".laya", ".bundledef", ".atlascfg",
    ".ls", ".lh", ".html", ".css", ".glsl", ".vs", ".fs"
)
$fileNames = @(".editorconfig", ".gitattributes", ".gitignore")

$files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $_.FullName -notmatch "[\\/](\.git|library|temp|bin|release|node_modules)[\\/]" -and
    (($extensions -contains $_.Extension.ToLowerInvariant()) -or ($fileNames -contains $_.Name))
}

foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length).TrimStart([char[]]@('\', '/'))
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)

    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $errors.Add("UTF-8 BOM is not allowed: $relative")
    }

    try {
        $text = $strictUtf8.GetString($bytes)
    } catch {
        $errors.Add("File is not valid UTF-8: $relative")
        continue
    }

    if ($text.Contains("`r")) {
        $errors.Add("Only LF line endings are allowed: $relative")
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Text format validation passed ($($files.Count) files, UTF-8 without BOM, LF)."
