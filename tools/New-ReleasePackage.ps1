[CmdletBinding()]
param(
    [string]$OutputDirectory = "dist",
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..")
)
$packagePath = Join-Path $projectRoot "package.json"
$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
$version = [string]$package.version

if ($version -notmatch '^\d+\.\d+\.\d+$') {
    throw "Ungültige Version in package.json: $version"
}

if (-not $SkipVerify) {
    Push-Location $projectRoot
    try {
        & npm.cmd run verify
        if ($LASTEXITCODE -ne 0) {
            throw "Die Projektverifikation ist fehlgeschlagen."
        }
    }
    finally {
        Pop-Location
    }
}

$outputRoot = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) {
    [System.IO.Path]::GetFullPath($OutputDirectory)
}
else {
    [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))
}
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null

$temporaryBase = [System.IO.Path]::GetFullPath(
    [System.IO.Path]::GetTempPath()
)
$stagingRoot = Join-Path $temporaryBase (
    "teo-release-" + [guid]::NewGuid().ToString("N")
)
$stagingDirectory = Join-Path $stagingRoot "stage"
New-Item -ItemType Directory -Path $stagingDirectory -Force | Out-Null

$rootFiles = @(
    "app.js",
    "backend-client.js",
    "index.html",
    "manifest.webmanifest",
    "project-meta.js",
    "state-schema.js",
    "styles.css"
)
$vendorFiles = @(
    "localforage.LICENSE",
    "localforage.min.js"
)
$iconFiles = @(
    "teo-app-icon-192.png",
    "teo-app-icon-512.png",
    "teo-app-icon-maskable-192.png",
    "teo-app-icon-maskable-512.png",
    "teo-apple-touch-icon.png",
    "teo-favicon.svg",
    "teo-favicon-32.png"
)

try {
    foreach ($fileName in $rootFiles) {
        Copy-Item -LiteralPath (Join-Path $projectRoot $fileName) `
            -Destination (Join-Path $stagingDirectory $fileName)
    }

    $vendorDirectory = Join-Path $stagingDirectory "vendor"
    New-Item -ItemType Directory -Path $vendorDirectory -Force | Out-Null
    foreach ($fileName in $vendorFiles) {
        Copy-Item -LiteralPath (Join-Path $projectRoot "vendor/$fileName") `
            -Destination (Join-Path $vendorDirectory $fileName)
    }

    $iconDirectory = Join-Path $stagingDirectory "assets/icons"
    New-Item -ItemType Directory -Path $iconDirectory -Force | Out-Null
    foreach ($fileName in $iconFiles) {
        Copy-Item -LiteralPath (Join-Path $projectRoot "assets/icons/$fileName") `
            -Destination (Join-Path $iconDirectory $fileName)
    }

    $archivePath = Join-Path $outputRoot (
        "TeO-$version-lokaler-Betrieb.zip"
    )
    Compress-Archive -Path (Join-Path $stagingDirectory "*") `
        -DestinationPath $archivePath -CompressionLevel Optimal -Force

    $archive = Get-Item -LiteralPath $archivePath
    $hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()

    Write-Output "Release-Paket: $($archive.FullName)"
    Write-Output "Größe: $($archive.Length) Bytes"
    Write-Output "SHA-256: $hash"
}
finally {
    $resolvedStagingRoot = [System.IO.Path]::GetFullPath($stagingRoot)
    if (
        $resolvedStagingRoot.StartsWith($temporaryBase, [System.StringComparison]::OrdinalIgnoreCase) -and
        (Test-Path -LiteralPath $resolvedStagingRoot)
    ) {
        Remove-Item -LiteralPath $resolvedStagingRoot -Recurse -Force
    }
}
