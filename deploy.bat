@echo off
REM ResellerHub AI Deployment Script for Windows
REM Deploy to remote server using Docker with Nginx and Meilisearch

set SERVER_USER=root
set SERVER_IP=192.168.1.18
set SERVER_PASSWORD=1
set REMOTE_DIR=/var/www/resellerhub

echo Starting deployment to %SERVER_IP%...

REM Step 1: Stop existing containers on server
echo [1/8] Stopping existing containers...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %SERVER_PASSWORD% "cd %REMOTE_DIR% && docker-compose down 2>/dev/null || true"

REM Step 2: Create remote directory
echo [2/8] Creating remote directory...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %SERVER_PASSWORD% "mkdir -p %REMOTE_DIR%"

REM Step 3: Copy files to server
echo [3/8] Copying files to server...
pscp -pw %SERVER_PASSWORD% docker-compose.yml Dockerfile package*.json %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%/
pscp -pw %SERVER_PASSWORD% -r routes models services middleware public nginx %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%/
pscp -pw %SERVER_PASSWORD% server.js %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%/

REM Step 4: Create .env file on server
echo [4/8] Creating environment file...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %SERVER_PASSWORD% "cat > %REMOTE_DIR%/.env << 'EOF'
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/resellerhub?authSource=admin
REDIS_URI=redis://redis:6379
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_MASTER_KEY=meilisearch_master_key_change_this_in_production
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d
EOF"

REM Step 5: Build Docker images
echo [5/8] Building Docker images...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %SERVER_PASSWORD% "cd %REMOTE_DIR% && docker-compose build"

REM Step 6: Start containers
echo [6/8] Starting containers (MongoDB, Redis, Meilisearch, App, Nginx)...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %SERVER_PASSWORD% "cd %REMOTE_DIR% && docker-compose up -d"

REM Step 7: Wait for services
echo [7/8] Waiting for services to be healthy...
timeout /t 15 /nobreak >nul

REM Check status
echo [8/8] Checking container status...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %SERVER_PASSWORD% "cd %REMOTE_DIR% && docker-compose ps"

REM View logs
echo.
echo Viewing application logs...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %SERVER_PASSWORD% "cd %REMOTE_DIR% && docker-compose logs --tail=50 app"

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo Services running:
echo   - MongoDB (port 27017)
echo   - Redis (port 6379)
echo   - Meilisearch (port 7700)
echo   - ResellerHub App (internal)
echo   - Nginx Reverse Proxy (ports 80, 443)
echo.
echo Application available at:
echo   - HTTP: http://%SERVER_IP%
echo   - HTTPS: https://%SERVER_IP% (if SSL configured)
echo.
pause
