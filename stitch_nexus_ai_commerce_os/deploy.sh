#!/bin/bash

# Deployment Script untuk AI Commerce OS
# Target Server: 192.168.1.18
# Install Path: /var/www/stitch_nexus_ai_commerce_os

set -e

echo "🚀 Memulai deployment AI Commerce OS..."

# Cek apakah Docker terinstall
if ! command -v docker &> /dev/null; then
    echo "❌ Docker tidak terinstall. Menginstall Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Cek apakah Docker Compose terinstall
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose tidak terinstall. Menginstall Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Buat direktori deployment
DEPLOY_PATH="/var/www/stitch_nexus_ai_commerce_os"
sudo mkdir -p $DEPLOY_PATH
sudo chown -R $USER:$USER $DEPLOY_PATH

# Copy file ke server deployment
echo "📦 Menyalin file ke $DEPLOY_PATH..."
cp -r . $DEPLOY_PATH/

# Setup environment variables
if [ ! -f $DEPLOY_PATH/.env ]; then
    echo "⚙️  Membuat .env dari template..."
    cp $DEPLOY_PATH/.env.example $DEPLOY_PATH/.env
    echo "⚠️  Silakan edit $DEPLOY_PATH/.env dengan nilai environment variables yang sesuai"
fi

# Stop containers yang sedang berjalan
echo "🛑 Menghentikan containers yang ada..."
cd $DEPLOY_PATH
docker-compose down 2>/dev/null || true

# Build dan start containers
echo "🔨 Membuild dan memulai containers..."
docker-compose up -d --build

# Cek status containers
echo "📊 Status containers:"
docker-compose ps

echo "✅ Deployment selesai!"
echo "🌐 Akses aplikasi di: http://192.168.1.18"
echo "📊 Dashboard pgAdmin: http://192.168.1.18:5050"
echo "🔍 Meilisearch: http://192.168.1.18:7700"
echo "📊 RabbitMQ Management: http://192.168.1.18:15672"
