#!/bin/bash

# ResellerHub AI Deployment Script
# Deploy to remote server using Docker

# Configuration
SERVER_USER="root"
SERVER_IP="192.168.1.18"
SERVER_PASSWORD="1"
REMOTE_DIR="/var/www/resellerhub"
APP_NAME="resellerhub-ai"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if plink is available (Windows) or ssh (Linux/Mac)
if command -v plink &> /dev/null; then
    SSH_CMD="plink -ssh ${SERVER_USER}@${SERVER_IP} -pw ${SERVER_PASSWORD}"
    SCP_CMD="pscp -pw ${SERVER_PASSWORD}"
elif command -v ssh &> /dev/null; then
    SSH_CMD="ssh ${SERVER_USER}@${SERVER_IP}"
    SCP_CMD="scp"
else
    print_error "Neither plink nor ssh found. Please install OpenSSH or PuTTY."
    exit 1
fi

print_info "Starting deployment to ${SERVER_IP}..."

# Step 1: Stop existing containers on server
print_info "Stopping existing containers..."
echo "y" | ${SSH_CMD} "cd ${REMOTE_DIR} && docker-compose down 2>/dev/null || true"

# Step 2: Create remote directory
print_info "Creating remote directory..."
echo "y" | ${SSH_CMD} "mkdir -p ${REMOTE_DIR}"

# Step 3: Copy files to server
print_info "Copying files to server..."
${SCP_CMD} -r docker-compose.yml Dockerfile package*.json ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
${SCP_CMD} -r routes models services middleware public ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
${SCP_CMD} server.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

# Step 4: Create .env file on server
print_info "Creating environment file..."
${SSH_CMD} "cat > ${REMOTE_DIR}/.env << 'EOF'
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/resellerhub?authSource=admin
REDIS_URI=redis://redis:6379
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d
EOF"

# Step 5: Build and start containers
print_info "Building Docker images..."
echo "y" | ${SSH_CMD} "cd ${REMOTE_DIR} && docker-compose build"

print_info "Starting containers..."
echo "y" | ${SSH_CMD} "cd ${REMOTE_DIR} && docker-compose up -d"

# Step 6: Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 10

# Step 7: Check status
print_info "Checking container status..."
echo "y" | ${SSH_CMD} "cd ${REMOTE_DIR} && docker-compose ps"

# Step 8: View logs
print_info "Viewing application logs..."
echo "y" | ${SSH_CMD} "cd ${REMOTE_DIR} && docker-compose logs --tail=50 app"

print_success "Deployment completed successfully!"
print_info "Application should be available at http://${SERVER_IP}:3000"
