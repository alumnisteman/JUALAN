# Server Deployment Guide - AI Commerce OS
## Target: 192.168.1.18 | Path: /var/www/stitch_nexus_ai_commerce_os

### Prerequisites
- Ubuntu/Debian Linux server at 192.168.1.18
- SSH access with root or sudo privileges
- Git installed
- Docker and Docker Compose installed

### Step 1: SSH ke Server

```bash
ssh root@192.168.1.18
```

### Step 2: Install Docker (jika belum)

```bash
# Update package list
apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Clone Repository

```bash
cd /var/www
git clone https://github.com/alumnisteman/JUALAN.git stitch_nexus_ai_commerce_os
cd stitch_nexus_ai_commerce_os
```

### Step 4: Setup Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit dengan nano atau vim
nano .env
```

**Wajib diisi:**
- `DB_PASSWORD` - Generate password kuat
- `ERP_DB_PASSWORD` - Generate password kuat
- `MEILI_MASTER_KEY` - Generate dengan: `openssl rand -hex 32`
- `PGADMIN_PASSWORD` - Password untuk pgAdmin
- `GEMINI_API_KEY` - Dari Google AI Studio
- `TIKTOK_CONTENT_CLIENT_KEY` dan `TIKTOK_CONTENT_CLIENT_SECRET` - Dari developers.tiktok.com
- `INSTAGRAM_APP_ID` dan `INSTAGRAM_APP_SECRET` - Dari developers.facebook.com

### Step 5: Build dan Start Containers

```bash
# Build dan start semua services
docker-compose up -d --build

# Cek status
docker-compose ps
```

### Step 6: Cek Logs (jika ada error)

```bash
# Lihat semua logs
docker-compose logs -f

# Lihat logs spesifik service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

### Step 7: Akses Aplikasi

Setelah deployment berhasil:

- **Frontend**: http://192.168.1.18
- **Backend API**: http://192.168.1.18:5000
- **pgAdmin**: http://192.168.1.18:5050
  - Email: admin@ai-commerce.com
  - Password: dari .env
- **Meilisearch**: http://192.168.1.18:7700
- **RabbitMQ Management**: http://192.168.1.18:15672
  - User: guest
  - Pass: guest

### Commands Penting

**Stop semua containers:**
```bash
docker-compose down
```

**Restart semua containers:**
```bash
docker-compose restart
```

**Update aplikasi dari GitHub:**
```bash
git pull
docker-compose up -d --build
```

**View logs real-time:**
```bash
docker-compose logs -f [service-name]
```

**Restart specific service:**
```bash
docker-compose restart backend
```

### Troubleshooting

**Container tidak start:**
```bash
docker-compose ps
docker-compose logs [service-name]
```

**Database connection error:**
- Cek PostgreSQL container running: `docker ps`
- Verifikasi environment variables di .env
- Restart database: `docker-compose restart database`

**Port conflict:**
```bash
netstat -tulpn
# Ubah port mapping di docker-compose.yml jika perlu
```

**Permission error:**
```bash
# Fix permission untuk volumes
sudo chown -R $USER:$USER /var/www/stitch_nexus_ai_commerce_os
```

### Security Notes

1. **Jangan commit .env ke git** - file ini sudah ada di .gitignore
2. **Gunakan password kuat** untuk database dan services
3. **Generate master key acak** untuk Meilisearch
4. **Limit access** ke pgAdmin dan RabbitMQ Management dari IP tertentu jika perlu
5. **Update regularly** dengan `git pull` dan `docker-compose up -d --build`

### Backup

**Backup database:**
```bash
docker exec ai-commerce-database pg_dump -U postgres ai_commerce > backup.sql
```

**Restore database:**
```bash
docker exec -i ai-commerce-database psql -U postgres ai_commerce < backup.sql
```

**Backup volumes:**
```bash
docker run --rm -v ai-commerce-postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```
