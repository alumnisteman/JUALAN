# ─────────────────────────────────────────────────────────────
# Deploy AI Commerce OS (versi sudah diperbaiki) ke GitHub
# Jalankan script ini di Windows dengan PowerShell
# dan sudah login git (git config + kredensial GitHub siap).
#
# Cara pakai:
#   1. Taruh file RESELLER_fixed.zip di folder yang sama dengan script ini
#   2. PowerShell: .\deploy.ps1
# ─────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/alumnisteman/JUALAN.git"
$WORKDIR = "jualan_deploy_tmp"
$ZIPFILE = "RESELLER_fixed.zip"

if (-not (Test-Path $ZIPFILE)) {
    Write-Host "❌ File $ZIPFILE tidak ditemukan di folder ini. Taruh dulu di sini." -ForegroundColor Red
    exit 1
}

Write-Host "▶ Clone repo..." -ForegroundColor Cyan
if (Test-Path $WORKDIR) {
    Remove-Item -Recurse -Force $WORKDIR
}
git clone $REPO_URL $WORKDIR
Set-Location $WORKDIR

Write-Host "▶ Backup .env lama kalau ada di repo (untuk jaga-jaga)..." -ForegroundColor Cyan
if (Test-Path "stitch_nexus_ai_commerce_os/.env") {
    $backupPath = "../env_backup_$(Get-Date -Format 'yyyyMMddHHmmss').bak"
    Copy-Item "stitch_nexus_ai_commerce_os/.env" $backupPath
    Write-Host "  → .env lama di-backup ke luar folder repo" -ForegroundColor Yellow
}

Write-Host "▶ Hapus folder lama, ganti dengan versi yang sudah diperbaiki..." -ForegroundColor Cyan
if (Test-Path "stitch_nexus_ai_commerce_os") {
    Remove-Item -Recurse -Force "stitch_nexus_ai_commerce_os"
}
Expand-Archive -Path "../$ZIPFILE" -DestinationPath . -Force

Write-Host "▶ Hapus .env dari folder yang diekstrak (jangan commit ke git)..." -ForegroundColor Cyan
if (Test-Path "stitch_nexus_ai_commerce_os/.env") {
    Remove-Item "stitch_nexus_ai_commerce_os/.env" -Force
    Write-Host "  → .env dihapus dari folder" -ForegroundColor Yellow
}

Write-Host "▶ Pastikan .env ada di .gitignore..." -ForegroundColor Cyan
if (-not (Test-Path "stitch_nexus_ai_commerce_os/.gitignore")) {
    Add-Content -Path "stitch_nexus_ai_commerce_os/.gitignore" -Value ".env"
    Write-Host "  → .env ditambahkan ke .gitignore" -ForegroundColor Yellow
}

Write-Host "▶ Commit & push..." -ForegroundColor Cyan
git add .
git commit -m "Fix: syntax error server.js, integrasi TikTok & Instagram posting API, service WhatsApp/Email/Payments nyata (Twilio/SendGrid/Stripe), keamanan docker-compose, dokumentasi lengkap instalasi-production"
git push origin main

Write-Host ""
Write-Host "✅ Selesai. Repo sudah ter-update: $REPO_URL" -ForegroundColor Green
Write-Host "⚠️  Jangan lupa: buat file .env di server produksi (bukan di git) dari .env.example, isi semua kredensial asli." -ForegroundColor Yellow

Set-Location ..
