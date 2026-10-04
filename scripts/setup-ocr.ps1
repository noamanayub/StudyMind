$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $projectRoot '.tools'
$ocrRoot = Join-Path $toolsRoot 'tesseract'
$ocrExe = Join-Path $ocrRoot 'tesseract.exe'
New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null

function Get-VerifiedReleaseAsset($Repository, $Tag, $AssetName, $Destination) {
    $release = Invoke-RestMethod "https://api.github.com/repos/$Repository/releases/tags/$Tag"
    $asset = $release.assets | Where-Object name -EQ $AssetName | Select-Object -First 1
    if (!$asset -or $asset.digest -notmatch '^sha256:[a-f0-9]{64}$') {
        throw "Release asset has no published SHA256 digest: $AssetName"
    }
    if (!(Test-Path -LiteralPath $Destination)) {
        Invoke-WebRequest $asset.browser_download_url -OutFile $Destination
    }
    $actual = (Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $asset.digest.Substring(7)) { throw "Checksum mismatch: $AssetName" }
}

if (!(Test-Path -LiteralPath $ocrExe)) {
    $installer = Join-Path $toolsRoot 'tesseract-setup.exe'
    Get-VerifiedReleaseAsset 'tesseract-ocr/tesseract' '5.5.3' 'tesseract-ocr-w64-setup-5.5.3.20260724.exe' $installer
    $archiveExe = Join-Path $toolsRoot '7zip-portable/Files/7-Zip/7z.exe'
    if (!(Test-Path -LiteralPath $archiveExe)) {
        $archiveMsi = Join-Path $toolsRoot '7zip-setup.msi'
        $archiveRoot = Join-Path $toolsRoot '7zip-portable'
        Get-VerifiedReleaseAsset 'ip7z/7zip' '26.03' '7z2603-x64.msi' $archiveMsi
        $process = Start-Process msiexec.exe -ArgumentList @('/a', "`"$archiveMsi`"", '/qn', "TARGETDIR=`"$archiveRoot`"") -WindowStyle Hidden -Wait -PassThru
        if ($process.ExitCode -ne 0) { throw "Archive extraction failed: $($process.ExitCode)" }
    }
    & $archiveExe x $installer "-o$ocrRoot" -y | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Tesseract archive extraction failed.' }
}
$dataRoot = Join-Path $ocrRoot 'tessdata'
New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
$english = Join-Path $dataRoot 'eng.traineddata'
if (!(Test-Path -LiteralPath $english)) {
    Invoke-WebRequest 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata' -OutFile $english
}
& $ocrExe --version
if ($LASTEXITCODE -ne 0) { throw 'Tesseract verification failed.' }
Write-Output 'Project-local OCR is ready. No system installation or PATH change was made.'
