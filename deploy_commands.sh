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
    echo "??????  Please edit .env with your actual credentials"
fi

# Stop containers yang sedang berjalan
docker-compose down 2>/dev/null || true

# Build dan start containers
echo "Building and starting containers..."
docker-compose up -d --build

# Cek status
echo "Container status:"
docker-compose ps

echo "??? Deployment completed!"
