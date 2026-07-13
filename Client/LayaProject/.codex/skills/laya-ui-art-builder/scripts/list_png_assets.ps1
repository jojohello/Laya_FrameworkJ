param(
    [string]$Root = "."
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

Get-ChildItem -LiteralPath $Root -Recurse -Filter *.png | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    try {
        [PSCustomObject]@{
            Path = $_.FullName
            Width = $img.Width
            Height = $img.Height
            Bytes = $_.Length
        }
    } finally {
        $img.Dispose()
    }
}
