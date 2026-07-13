$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$textValidator = Join-Path $PSScriptRoot "validate-text-format.ps1"
& $textValidator
if (-not $?) {
    exit 1
}

$errors = [System.Collections.Generic.List[string]]::new()

$docs = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $_.Name -in @("AGENTS.md", "README.md", "DESIGN.md", "Design.md", "PlanAndStatus.md") -and
    $_.FullName -notmatch "[\\/]\.qoder[\\/]" -and
    $_.FullName -notmatch "[\\/]node_modules[\\/]"
}

$strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)

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

    $matches = [regex]::Matches($content, "\[[^\]]+\]\(([^)]+)\)")
    foreach ($match in $matches) {
        $target = $match.Groups[1].Value.Trim()
        if ($target -match "^(?:https?:|mailto:|#)" -or $target.Contains("*")) {
            continue
        }

        $target = $target.Split("#")[0]
        if ([string]::IsNullOrWhiteSpace($target)) {
            continue
        }

        $decoded = [System.Uri]::UnescapeDataString($target)
        $resolved = Join-Path $doc.DirectoryName $decoded
        if (-not (Test-Path -LiteralPath $resolved)) {
            $errors.Add("Broken relative link in ${relative}: $target")
        }
    }
}

$stalePatterns = @(
    "\.ai/context/next-actions\.md"
)

foreach ($pattern in $stalePatterns) {
    foreach ($doc in $docs) {
        $content = [System.IO.File]::ReadAllText($doc.FullName, $strictUtf8)
        if ($content -match $pattern) {
            $relative = $doc.FullName.Substring($root.Length).TrimStart([char[]]@('\', '/'))
            $errors.Add("Stale document-system statement in $relative")
        }
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Document system validation passed ($($docs.Count) files)."
