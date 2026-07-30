# Script batch untuk menyuntikkan script automation-engine.js ke semua modul code.html
$base = "d:\RESELLER\stitch_nexus_ai_commerce_os"

# Cari semua file code.html di subfolder
$files = Get-ChildItem -Path $base -Filter "code.html" -Recurse

$injectTag = "<script src=`"../js/automation-engine.js`"></script>`n</body>"

$count = 0
foreach ($file in $files) {
    # Skip the file in the root if it exists, though typically they are in subfolders
    if ($file.DirectoryName -eq $base) {
        continue
    }

    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Check if already injected
    if (-not $content.Contains("automation-engine.js")) {
        # Ganti </body> dengan tag skrip kita + </body>
        $content = $content -replace "</body>", $injectTag
        $content | Set-Content $file.FullName -Encoding UTF8
        Write-Host "Injected into $($file.Directory.Name)"
        $count++
    }
}

Write-Host "`nBerhasil menyuntikkan Automation Engine ke $count modul!"
