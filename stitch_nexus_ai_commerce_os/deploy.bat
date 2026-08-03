@echo off
REM Deployment Script untuk AI Commerce OS (Windows)
REM Target Server: 192.168.1.18
REM Install Path: /var/www/stitch_nexus_ai_commerce_os

echo 🚀 Memulai deployment AI Commerce OS ke server 192.168.1.18...

REM Cek apakah SCP tersedia (gunakan WinSCP atau pscp dari PuTTY)
where pscp >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pscp tidak ditemukan. Silakan install PuTTY atau gunakan WinSCP.
    echo Download: https://www.putty.org/
    pause
    exit /b 1
)

REM Cek apakah SSH tersedia
where plink >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ plink tidak ditemukan. Silakan install PuTTY.
    echo Download: https://www.putty.org/
    pause
    exit /b 1
)

REM Copy file ke server
echo 📦 Menyalin file ke server...
psscp -r . root@192.168.1.18:/var/www/stitch_nexus_ai_commerce_os/

REM Jalankan deployment di server
echo 🔨 Menjalankan deployment di server...
plink root@192.168.1.18 "cd /var/www/stitch_nexus_ai_commerce_os && chmod +x deploy.sh && ./deploy.sh"

echo ✅ Deployment selesai!
echo 🌐 Akses aplikasi di: http://192.168.1.18
echo 📊 Dashboard pgAdmin: http://192.168.1.18:5050
echo 🔍 Meilisearch: http://192.168.1.18:7700
echo 📊 RabbitMQ Management: http://192.168.1.18:15672

pause
