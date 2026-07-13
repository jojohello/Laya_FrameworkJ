$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
& (Join-Path $PSScriptRoot "validate-text-format.ps1")
if (-not $?) { exit 1 }

$childValidators = @(
    (Join-Path $root "Client/LayaProject/tools/docs/validate-doc-system.ps1"),
    (Join-Path $root "Sever/tools/docs/validate-doc-system.ps1")
)
foreach ($validator in $childValidators) {
    & $validator
    if (-not $?) { exit 1 }
}

$errors = [System.Collections.Generic.List[string]]::new()
$strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
$legacyPaths = @(
    "CLAUDE.md",
    "PROJECT_STATUS.md",
    ".ai",
    "Protocol/PROTOCOL_DESIGN.md"
)
foreach ($relative in $legacyPaths) {
    if (Test-Path -LiteralPath (Join-Path $root $relative)) {
        $errors.Add("Legacy document entry must be removed: $relative")
    }
}

$docs = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $relative = $_.FullName.Substring($root.Length).TrimStart([char[]]@('\', '/'))
    ($_.Name -in @("AGENTS.md", "README.md", "DESIGN.md", "Design.md", "PlanAndStatus.md")) -and
    ($relative -notmatch "^(Client[\\/]LayaProject|Sever)[\\/]") -and
    ($relative -match "^[^\\/]+$|^(Config|Protocol)[\\/]") -and
    $_.FullName -notmatch "[\\/](node_modules|generated)[\\/]"
}

foreach ($doc in $docs) {
    $relative = $doc.FullName.Substring($root.Length).TrimStart([char[]]@('\', '/'))
    if ($doc.Name -ceq "Design.md") {
        $errors.Add("Use DESIGN.md casing: $relative")
    }

    try {
        $content = $strictUtf8.GetString([System.IO.File]::ReadAllBytes($doc.FullName))
    } catch {
        $errors.Add("Not valid UTF-8: $relative")
        continue
    }

    if ([string]::IsNullOrWhiteSpace($content)) {
        $errors.Add("Empty document should be removed: $relative")
        continue
    }

    if ($doc.Name -eq "PlanAndStatus.md") {
        if ($content -match "(?m)^\s*-\s*\[[xX]\]") {
            $errors.Add("Plan contains completed checklist items: $relative")
        }
        if ($content -notmatch "(?m)^\s*-\s*\[ \]") {
            $errors.Add("Plan has no unfinished checklist item and should be removed: $relative")
        }
    }

    foreach ($match in [regex]::Matches($content, "\[[^\]]+\]\(([^)]+)\)")) {
        $target = $match.Groups[1].Value.Trim()
        if ($target -match "^(?:https?:|mailto:|#)" -or $target.Contains("*")) { continue }
        $target = $target.Split("#")[0]
        if ([string]::IsNullOrWhiteSpace($target)) { continue }
        $resolved = Join-Path $doc.DirectoryName ([System.Uri]::UnescapeDataString($target))
        if (-not (Test-Path -LiteralPath $resolved)) {
            $errors.Add("Broken relative link in ${relative}: $target")
        }
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Framework-J document system validation passed ($($docs.Count) root/Config/Protocol documents)."
