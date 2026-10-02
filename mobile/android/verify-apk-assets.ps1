param(
 [Parameter(Mandatory=$true)][string]$ApkPath,
 [Parameter(Mandatory=$true)][string]$DistPath
)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$distRoot=(Resolve-Path -LiteralPath $DistPath).Path
$zip=[System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ApkPath).Path)
try {
 $names=[System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
 foreach ($entry in $zip.Entries) {
  if ($entry.FullName.Contains('\')) { throw "Android cannot resolve backslash ZIP entry: $($entry.FullName)" }
  if (!$names.Add($entry.FullName)) { throw "Duplicate ZIP entry: $($entry.FullName)" }
 }
 foreach ($required in @('AndroidManifest.xml','classes.dex','assets/web/index.html','assets/web/startup.js')) {
  if (!$names.Contains($required)) { throw "APK missing exact Android path: $required" }
 }
 $count=0
 foreach ($file in Get-ChildItem -LiteralPath $distRoot -Recurse -File) {
  $relative=[System.IO.Path]::GetRelativePath($distRoot,$file.FullName).Replace('\','/')
  $name='assets/web/'+$relative
  $entry=$zip.GetEntry($name)
  if ($null -eq $entry) { throw "APK missing exact Android path: $name" }
  $stream=$entry.Open()
  $sha=[System.Security.Cryptography.SHA256]::Create()
  try { $actual=[System.BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','') }
  finally { $stream.Dispose(); $sha.Dispose() }
  $expected=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
  if ($actual -ne $expected) { throw "APK asset content mismatch: $name" }
  $count++
 }
 Write-Output "PASS $count exact Android asset paths and SHA256 contents in raw APK (without extracting)."
} finally { $zip.Dispose() }
