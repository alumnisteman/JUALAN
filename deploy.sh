#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Deploy AI Commerce OS (versi sudah diperbaiki) ke GitHub
# Jalankan script ini di server/komputer yang punya akses internet
# dan sudah login git (git config + kredensial GitHub siap).
#
# Cara pakai:
#   1. Taruh file RESELLER_fixed.zip di folder yang sama dengan script ini
#   2. chmod +x deploy.sh
#   3. ./deploy.sh
# ─────────────────────────────────────────────────────────────
set -e

REPO_URL="https://github.com/alumnisteman/JUALAN.git"
WORKDIR="jualan_deploy_tmp"
ZIPFILE="RESELLER_fixed.zip"

if [ ! -f "$ZIPFILE" ]; then
  echo "❌ File $ZIPFILE tidak ditemukan di folder ini. Taruh dulu di sini."
  exit 1
fi

echo "▶ Clone repo..."
rm -rf "$WORKDIR"
git clone "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"

echo "▶ Backup .env lama kalau ada di repo (untuk jaga-jaga)..."
if [ -f "stitch_nexus_ai_commerce_os/.env" ]; then
  cp stitch_nexus_ai_commerce_os/.env ../env_backup_$(date +%s).bak
  echo "  → .env lama di-backup ke luar folder repo"
fi

echo "▶ Hapus folder lama, ganti dengan versi yang sudah diperbaiki..."
rm -rf stitch_nexus_ai_commerce_os
unzip -q "../$ZIPFILE" -d . || { echo "❌ Unzip failed"; exit 1; }

echo "▶ Pastikan .env TIDAK ikut ter-commit..."
if git status --porcelain | grep -q "\.env$"; then
  echo "❌ STOP: .env terdeteksi mau ke-commit! Cek .gitignore dulu."
  exit 1
fi

echo "▶ Commit & push..."
git add .
git commit -m "Perbarui skrip penyebaran dan perbaiki penanganan zip"
git push origin main

echo ""
echo "✅ Selesai. Repo sudah ter-update: $REPO_URL"
echo "⚠️  Jangan lupa: buat file .env di server produksi (bukan di git) dari .env.example, isi semua kredensial asli."
