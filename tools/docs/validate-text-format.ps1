$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$errors = [System.Collections.Generic.List[string]]::new()
$strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
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

Write-Host "Root/Config/Protocol text validation passed ($($files.Count) files)."
