# Deployment Script untuk Server 192.168.1.13
# User: root, Password: 1

$ErrorActionPreference = "Stop"

$SERVER = "192.168.1.13"
$USER = "root"
$PASSWORD = "1"
$REPO_URL = "https://github.com/alumnisteman/JUALAN.git"
$DEPLOY_PATH = "/var/www/stitch_nexus_ai_commerce_os"

Write-Host "🚀 Memulai deployment ke server $SERVER..." -ForegroundColor Cyan

# Cek apakah plink tersedia (untuk SSH dari Windows)
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue
if (-not $plinkPath) {
    Write-Host "❌ plink tidak ditemukan. Install PuTTY atau gunakan OpenSSH client." -ForegroundColor Red
    Write-Host "Download PuTTY: https://www.putty.org/" -ForegroundColor Yellow
    exit 1
}

# Cek apakah pscp tersedia (untuk file transfer)
$pscpPath = Get-Command pscp -ErrorAction SilentlyContinue
if (-not $pscpPath) {
    Write-Host "❌ pscp tidak ditemukan. Install PuTTY." -ForegroundColor Red
    exit 1
}

Write-Host "▶ Menghubungkan ke server $SERVER..." -ForegroundColor Cyan

# Commands untuk dijalankan di server
$commands = @'
# Update package list
apt update

# Install Docker jika belum ada
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker root
fi

# Install Docker Compose jika belum ada
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Buat direktori deployment
mkdir -p /var/www
cd /var/www

# Clone atau update repository
if [ -d "stitch_nexus_ai_commerce_os" ]; then
    echo "Updating existing repository..."
    cd stitch_nexus_ai_commerce_os
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/alumnisteman/JUALAN.git stitch_nexus_ai_commerce_os
    cd stitch_nexus_ai_commerce_os
fi

# Setup .env jika belum ada
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual credentials"
fi

# Stop containers yang sedang berjalan
docker-compose down 2>/dev/null || true

# Build dan start containers
echo "Building and starting containers..."
docker-compose up -d --build

# Cek status
echo "Container status:"
docker-compose ps

echo "✅ Deployment completed!"
'@

# Simpan commands ke file temp
$commandsFile = "deploy_commands.sh"
$commands | Out-File -FilePath $commandsFile -Encoding ASCII

# Upload commands file ke server
Write-Host "▶ Upload deployment script ke server..." -ForegroundColor Cyan
& pscp -pw $PASSWORD $commandsFile ${USER}@${SERVER}:/tmp/

# Jalankan commands di server
Write-Host "▶ Menjalankan deployment di server..." -ForegroundColor Cyan
$cmdOutput = & plink -pw $PASSWORD ${USER}@${SERVER} -m $commandsFile 2>&1
Write-Host $cmdOutput

# Cleanup temp file
Remove-Item $commandsFile

Write-Host ""
Write-Host "✅ Deployment selesai!" -ForegroundColor Green
Write-Host "🌐 Akses aplikasi di: http://$SERVER" -ForegroundColor Cyan
Write-Host "📊 Backend API: http://$SERVER:5000" -ForegroundColor Cyan
Write-Host "📊 pgAdmin: http://$SERVER:5050" -ForegroundColor Cyan
Write-Host "🔍 Meilisearch: http://$SERVER:7700" -ForegroundColor Cyan
Write-Host "📊 RabbitMQ: http://$SERVER:15672" -ForegroundColor Cyan
