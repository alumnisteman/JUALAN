# Deployment Guide - AI Commerce OS
## Server: 192.168.1.18 | Path: /var/www/stitch_nexus_ai_commerce_os

### Prerequisites di Server
- Ubuntu/Debian Linux
- SSH access
- Docker dan Docker Compose terinstall

### Langkah 1: Install Docker di Server (jika belum)

SSH ke server:
```bash
ssh root@192.168.1.18
```

Install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Install Docker Compose:
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Langkah 2: Clone Repository di Server

```bash
cd /var/www
git clone https://github.com/alumnisteman/JUALAN.git stitch_nexus_ai_commerce_os
cd stitch_nexus_ai_commerce_os
```

### Langkah 3: Setup Environment Variables

```bash
cp .env.example .env
nano .env  # Edit dengan nilai yang sesuai
```

**Wajib diubah:**
- `DB_PASSWORD` - Password PostgreSQL
- `ERP_DB_PASSWORD` - Password ERP Database
- `MEILI_MASTER_KEY` - Generate dengan: `openssl rand -hex 32`
- `PGADMIN_PASSWORD` - Password pgAdmin
- `GEMINI_API_KEY` - API Key Google Gemini
- `TIKTOK_CONTENT_CLIENT_KEY` dan `TIKTOK_CONTENT_CLIENT_SECRET` - Dari developers.tiktok.com
- `INSTAGRAM_APP_ID` dan `INSTAGRAM_APP_SECRET` - Dari developers.facebook.com

### Langkah 4: Build dan Start Containers

```bash
docker-compose up -d --build
```

### Langkah 5: Cek Status Containers

```bash
docker-compose ps
```

### Langkah 6: Cek Logs (jika ada error)

```bash
docker-compose logs -f
```

### Akses Aplikasi

Setelah deployment berhasil:

- **Frontend**: http://192.168.1.18
- **Backend API**: http://192.168.1.18:5000
- **pgAdmin**: http://192.168.1.18:5050 (Email: admin@ai-commerce.com, Password: dari .env)
- **Meilisearch**: http://192.168.1.18:7700
- **RabbitMQ Management**: http://192.168.1.18:15672 (User: guest, Pass: guest)

### Commands Penting

**Stop semua containers:**
```bash
docker-compose down
```

**Restart semua containers:**
```bash
docker-compose restart
```

**View logs spesifik:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Update aplikasi:**
```bash
git pull
docker-compose up -d --build
```

### Troubleshooting

**Container tidak start:**
```bash
docker-compose logs [service-name]
```

**Database connection error:**
- Pastikan PostgreSQL container running: `docker ps`
- Cek environment variables di .env

**Port conflict:**
- Cek port yang digunakan: `netstat -tulpn`
- Ubah port mapping di docker-compose.yml jika perlu
