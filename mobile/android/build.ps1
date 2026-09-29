param(
 [Parameter(Mandatory=$true)][string]$SdkRoot,
 [Parameter(Mandatory=$true)][string]$JdkRoot,
 [Parameter(Mandatory=$true)][string]$SigningDir,
 [string]$OutputDir = (Join-Path $PSScriptRoot 'build/release')
)
$ErrorActionPreference='Stop'
$mobileRoot = Split-Path $PSScriptRoot -Parent
$distPath = Join-Path $mobileRoot 'dist'
if (!(Test-Path -LiteralPath (Join-Path $distPath 'index.html'))) { throw 'Build the mobile app before packaging.' }
$asciiRoot = Join-Path ([System.IO.Path]::GetPathRoot($PSScriptRoot)) 'huinong-android-build'
$buildRoot = Join-Path $asciiRoot (Get-Date -Format 'yyyyMMdd-HHmmss')
$toolsRoot = Join-Path $SdkRoot 'build-tools_r36_windows/android-16'
$androidJarSource = Join-Path $SdkRoot 'platform-36_r02/android-36/android.jar'
$androidJar = Join-Path $asciiRoot 'android-36.jar'
$java = Join-Path $JdkRoot 'bin/java.exe'
$javac = Join-Path $JdkRoot 'bin/javac.exe'
$jar = Join-Path $JdkRoot 'bin/jar.exe'
$classes = Join-Path $buildRoot 'classes'
$dex = Join-Path $buildRoot 'dex'
$assetRoot = Join-Path $buildRoot 'assets/web'
New-Item -ItemType Directory -Force -Path $classes,$dex,$assetRoot,$SigningDir,$OutputDir | Out-Null
Copy-Item -LiteralPath $androidJarSource -Destination $androidJar -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'res') -Destination (Join-Path $buildRoot 'res') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'AndroidManifest.xml') -Destination (Join-Path $buildRoot 'AndroidManifest.xml') -Force
Copy-Item -Path (Join-Path $distPath '*') -Destination $assetRoot -Recurse -Force
$javaSources = @(Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'src') -Filter '*.java' -Recurse | ForEach-Object FullName)
& $javac --release 8 -encoding UTF-8 -classpath $androidJar -d $classes $javaSources
if ($LASTEXITCODE -ne 0) { throw 'javac failed' }
$classesJar=Join-Path $buildRoot 'classes.jar'
& $jar cf $classesJar -C $classes .
if ($LASTEXITCODE -ne 0) { throw 'jar failed' }
& $java -cp (Join-Path $toolsRoot 'lib/d8.jar') com.android.tools.r8.D8 --release --min-api 26 --lib $androidJar --output $dex $classesJar
if ($LASTEXITCODE -ne 0) { throw 'd8 failed' }
$resources=Join-Path $buildRoot 'resources.zip'
& (Join-Path $toolsRoot 'aapt2.exe') compile --dir (Join-Path $buildRoot 'res') -o $resources
if ($LASTEXITCODE -ne 0) { throw 'aapt2 compile failed' }
$unsigned=Join-Path $buildRoot 'unsigned.apk'
& (Join-Path $toolsRoot 'aapt2.exe') link -I $androidJar --manifest (Join-Path $buildRoot 'AndroidManifest.xml') -A (Split-Path $assetRoot -Parent) --auto-add-overlay -o $unsigned $resources
if ($LASTEXITCODE -ne 0) { throw 'aapt2 link failed' }
Add-Type -AssemblyName System.IO.Compression
$zip=[System.IO.Compression.ZipFile]::Open($unsigned,[System.IO.Compression.ZipArchiveMode]::Update)
try { [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $dex 'classes.dex'),'classes.dex',[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null } finally { $zip.Dispose() }
$aligned=Join-Path $buildRoot 'aligned.apk'
& (Join-Path $toolsRoot 'zipalign.exe') -f -p 4 $unsigned $aligned
if ($LASTEXITCODE -ne 0) { throw 'zipalign failed' }
$keystore=Join-Path $SigningDir 'huinong-release.jks'
$secretFile=Join-Path $SigningDir 'signing-password.dpapi'
if (!(Test-Path -LiteralPath $keystore)) {
 if (Test-Path -LiteralPath $secretFile) { throw 'Existing signing metadata without keystore; inspect before replacing.' }
 $password=[guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')
 $secure=ConvertTo-SecureString -String $password -AsPlainText -Force
 ConvertFrom-SecureString -SecureString $secure | Set-Content -LiteralPath $secretFile
 $env:HUINONG_STORE_PASS=$password
 & (Join-Path $JdkRoot 'bin/keytool.exe') -genkeypair -keystore $keystore -storetype JKS -alias huinong -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Huinong Mobile, O=Huinong, C=CN' -storepass:env HUINONG_STORE_PASS -keypass:env HUINONG_STORE_PASS
 if ($LASTEXITCODE -ne 0) { throw 'keytool failed' }
} else {
 $secure=Get-Content -LiteralPath $secretFile | ConvertTo-SecureString
 $env:HUINONG_STORE_PASS=[System.Net.NetworkCredential]::new('',$secure).Password
}
$apk=Join-Path $buildRoot 'huinong-farm-1.0.0.apk'
try {
 & $java -jar (Join-Path $toolsRoot 'lib/apksigner.jar') sign --ks $keystore --ks-key-alias huinong --ks-pass env:HUINONG_STORE_PASS --key-pass env:HUINONG_STORE_PASS --out $apk $aligned
 if ($LASTEXITCODE -ne 0) { throw 'Signing failed' }
} finally { Remove-Item Env:HUINONG_STORE_PASS }
& $java -jar (Join-Path $toolsRoot 'lib/apksigner.jar') verify --verbose --print-certs $apk
if ($LASTEXITCODE -ne 0) { throw 'Signature validation failed' }
& (Join-Path $toolsRoot 'zipalign.exe') -c -v 4 $apk | Select-Object -Last 1
if ($LASTEXITCODE -ne 0) { throw 'Alignment validation failed' }
& (Join-Path $toolsRoot 'aapt.exe') dump badging $apk | Select-Object -First 10
Copy-Item -LiteralPath $apk -Destination (Join-Path $OutputDir 'huinong-farm-1.0.0.apk') -Force
$hash=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  huinong-farm-1.0.0.apk" | Set-Content -LiteralPath (Join-Path $OutputDir 'SHA256SUMS.txt')
Write-Output "APK: $(Join-Path $OutputDir 'huinong-farm-1.0.0.apk')"
