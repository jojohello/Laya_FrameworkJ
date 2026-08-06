$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$assetsRoot = Join-Path $root "assets"
$strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
$errors = [System.Collections.Generic.List[string]]::new()
$checkedCount = 0

$horizontalTypes = @(1, 3, 4, 5, 6, 7, 8, 9, 17, 18, 19, 20, 100, 101, 102)
$verticalTypes = @(2, 10, 11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 100, 101, 102)

function Get-RelationTypes($relation) {
    $types = [System.Collections.Generic.List[int]]::new()
    $data = @($relation.data)
    for ($index = 0; $index -lt $data.Count; $index += 2) {
        if ($null -ne $data[$index]) {
            $types.Add([int]$data[$index])
        }
    }
    return $types
}

function Get-AllNodes($node) {
    if ($null -eq $node) { return }
    Write-Output $node
    foreach ($child in @($node.'_$child')) {
        if ($null -ne $child) { Get-AllNodes $child }
    }
}

function Add-Error([string]$relative, [string]$message) {
    $errors.Add("${relative}: $message")
}

$files = Get-ChildItem -LiteralPath $assetsRoot -Recurse -File | Where-Object {
    $_.Extension -in @(".ls", ".lh")
}

foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length).TrimStart([char[]]@('\', '/'))
    try {
        $content = $strictUtf8.GetString([System.IO.File]::ReadAllBytes($file.FullName))
    } catch {
        Add-Error $relative "not valid UTF-8"
        continue
    }
    if ($content -notmatch '"name"\s*:\s*"safeAreaRoot"') { continue }

    try {
        $document = $content | ConvertFrom-Json
    } catch {
        Add-Error $relative "invalid JSON: $($_.Exception.Message)"
        continue
    }

    $checkedCount++
    $pageRootId = [string]$document.'_$id'
    $directChildren = @($document.'_$child') | Where-Object { $null -ne $_ }
    $directChildIds = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($directChild in $directChildren) {
        [void]$directChildIds.Add([string]$directChild.'_$id')
    }
    $safeRoots = @($directChildren | Where-Object { $_.name -ceq "safeAreaRoot" })
    if ($safeRoots.Count -ne 1) {
        Add-Error $relative "must declare exactly one direct safeAreaRoot GBox"
        continue
    }

    $safeRoot = $safeRoots[0]
    $safeRootId = [string]$safeRoot.'_$id'
    if ($safeRoot.'_$type' -cne "GBox") {
        Add-Error $relative "safeAreaRoot must be a GBox"
    }
    if ([double]$safeRoot.x -ne 0 -or [double]$safeRoot.y -ne 0 -or
        [double]$safeRoot.width -ne 750 -or [double]$safeRoot.height -ne 1334) {
        Add-Error $relative "safeAreaRoot must keep the 0,0,750,1334 design rectangle"
    }
    if (@($safeRoot.relations | Where-Object { $null -ne $_ }).Count -gt 0) {
        Add-Error $relative "SafeAreaLayout exclusively owns safeAreaRoot geometry; remove its Relations"
    }

    foreach ($child in $directChildren) {
        if ($child -eq $safeRoot) { continue }
        $name = [string]$child.name
        $relations = @($child.relations) | Where-Object { $null -ne $_ }

        if ($name.StartsWith("fullBleed", [System.StringComparison]::Ordinal)) {
            foreach ($relation in $relations) {
                if ([string]$relation.target.'_$ref' -eq $safeRootId) {
                    Add-Error $relative "full-bleed node '$name' must target the page root, not safeAreaRoot"
                }
            }
            continue
        }

        $safeRelations = @($relations | Where-Object {
            [string]$_.target.'_$ref' -eq $safeRootId
        })
        if ($safeRelations.Count -eq 0) {
            Add-Error $relative "direct safe-content node '$name' must relate to safeAreaRoot"
        }

        if ($name -ceq "menuButtonAvoidanceRoot") {
            foreach ($relation in $relations) {
                $vertical = @(Get-RelationTypes $relation | Where-Object { $_ -in $verticalTypes })
                if ($vertical.Count -gt 0) {
                    Add-Error $relative "menuButtonAvoidanceRoot vertical axis belongs to SafeAreaLayout"
                }
            }
        }
    }

    foreach ($node in @(Get-AllNodes $document)) {
        $nodeName = [string]$node.name
        $nodeId = [string]$node.'_$id'
        if ($nodeName.StartsWith("fullBleed", [System.StringComparison]::Ordinal)) { continue }

        $horizontalTargets = [System.Collections.Generic.HashSet[string]]::new()
        $verticalTargets = [System.Collections.Generic.HashSet[string]]::new()
        foreach ($relation in @($node.relations)) {
            if ($null -eq $relation) { continue }
            $targetId = [string]$relation.target.'_$ref'
            $types = @(Get-RelationTypes $relation)
            if ($types | Where-Object { $_ -in $horizontalTypes }) {
                [void]$horizontalTargets.Add($targetId)
            }
            if ($types | Where-Object { $_ -in $verticalTypes }) {
                [void]$verticalTargets.Add($targetId)
            }
            if ($targetId -eq $pageRootId -and $types.Count -gt 0) {
                Add-Error $relative "safe-content node '$nodeName' relates to page root; target safeAreaRoot or a local container"
            }
            if ($targetId -eq $safeRootId -and -not $directChildIds.Contains($nodeId)) {
                Add-Error $relative "nested node '$nodeName' must relate to its local container, not safeAreaRoot"
            }
        }
        if ($horizontalTargets.Count -gt 1) {
            Add-Error $relative "node '$nodeName' has multiple horizontal Relation owners"
        }
        if ($verticalTargets.Count -gt 1) {
            Add-Error $relative "node '$nodeName' has multiple vertical Relation owners"
        }
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { [Console]::Error.WriteLine($_) }
    exit 1
}

Write-Host "Safe-area Relation validation passed ($checkedCount files)."
