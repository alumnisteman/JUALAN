# 📘 Panduan Lengkap AI Commerce OS

Panduan ini berisi instruksi lengkap mengenai instalasi, pengoperasian, konfigurasi, dan pemeliharaan (maintenance) infrastruktur **AI Commerce OS** yang didukung oleh Docker.

---

## 🏗️ 1. Arsitektur Sistem

AI Commerce OS berjalan di atas arsitektur *microservices* terisolasi menggunakan Docker Compose:
- **Frontend (Nginx):** Berjalan di Port `80`. Menyajikan antarmuka pengguna statis.
- **Backend (Node.js/Express):** Berjalan di Port `3000`. Mengelola API, cron jobs, dan scraping data.
- **Database (PostgreSQL):** Berjalan di Port `5432`. Menyimpan keseluruhan data pesanan dan produk.
- **Cache (Redis):** Berjalan di Port `6379`. Menyimpan data API (*cache-aside*) untuk mempercepat *load* halaman.
- **Search Engine (Meilisearch):** Berjalan di Port `7700`. Mesin pencari instan berbasis *typo-tolerance*.
- **Database Manager (pgAdmin):** Berjalan di Port `5050`. Antarmuka UI untuk mengelola PostgreSQL secara visual.

---

## 🚀 2. Panduan Instalasi (Deployment ke Server Baru)

Jika Anda memindahkan sistem ini ke server Ubuntu baru, ikuti langkah berikut:

### Langkah 1: Persiapan Server
1. Login ke server via SSH: `ssh root@IP_SERVER_ANDA`
2. Update sistem: `apt update && apt upgrade -y`
3. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
4. Pastikan `docker compose` telah terinstal: `docker compose version`

### Langkah 2: Memasukkan Kode ke Server
Jika Anda memiliki akses ke GitHub, lakukan kloning (clone) repositori Anda:
```bash
cd /opt
mkdir reseller && cd reseller
git clone https://github.com/alumnisteman/JUALAN.git stitch_nexus_ai_commerce_os
cd stitch_nexus_ai_commerce_os
```

### Langkah 3: Konfigurasi Keamanan (Environment)
Buat file bernama `.env` di direktori proyek (`/opt/reseller/stitch_nexus_ai_commerce_os`) untuk meletakkan **API Keys**:
```bash
nano .env
```
Isi dengan data berikut (sesuaikan API Key Scraper Anda):
```env
SCRAPER_API_KEY=a2beb968de2d35faa9ed609f5c0470a6
```
*(Tekan `CTRL + X`, lalu `Y`, lalu `Enter` untuk menyimpan).*

### Langkah 4: Menjalankan Sistem
Jalankan seluruh kontainer di belakang layar (daemon mode):
```bash
docker compose up -d
```
Tunggu sekitar 1-2 menit agar semua proses (termasuk instalasi pustaka backend) selesai.

---

## 🎮 3. Cara Pengoperasian Sehari-hari

### A. Mengakses Halaman Layanan
Setelah server berjalan, Anda dapat langsung mengaksesnya melalui browser:
- **Dashboard Utama:** `http://IP_SERVER_ANDA` (Contoh: `http://192.168.1.18`)
- **Cek Status API:** `http://IP_SERVER_ANDA:3000/health`
- **Dashboard Database (pgAdmin):** `http://IP_SERVER_ANDA:5050`
  - **Email:** `admin@ai-commerce.com`
  - **Password:** `admin123`
  - *Untuk menghubungkan pgAdmin ke database, buat Server baru di pgAdmin dan arahkan Host ke `database` dengan username/password `postgres`.*

### B. Cara Kerja Sistem Aggregator/Scraper Marketplace
Sistem telah dilengkapi dengan *cron job* yang akan berjalan **otomatis setiap 6 jam**. 
Marketplace yang didukung: *Tokopedia, Shopee, Lazada, Blibli, Zalora, dan TikTok Shop*.
- Tokopedia, Shopee, Blibli, dan TikTok menggunakan jalur Proxy dari ScraperAPI untuk menghindari blokir.
- Anda dapat memicu (*trigger*) *scraping* manual kapan saja dengan mengirimkan POST request kosong:
  ```bash
  curl -X POST http://IP_SERVER_ANDA:3000/api/marketplace/scrape
  ```

---

## 🛠️ 4. Panduan Pemeliharaan (Maintenance) & Troubleshooting

Berikut adalah perintah terminal yang umum digunakan di folder `/opt/reseller/stitch_nexus_ai_commerce_os`.

### 1. Melihat Status Server
```bash
docker compose ps
```
*Pastikan semua layanan memiliki status `Up`.*

### 2. Memeriksa Log Error (Penting saat ada Bug)
Jika backend error atau scraper gagal, Anda bisa mengecek log prosesnya:
```bash
# Melihat 50 baris terakhir dari backend
docker logs ai-commerce-backend --tail 50

# Melihat log secara real-time
docker logs ai-commerce-backend -f
```

### 3. Merestart Layanan (Misal: Setelah Mengubah Kode)
Jika Anda memperbarui kode JavaScript di backend, Anda harus me-restart modul tersebut agar perubahannya aktif:
```bash
docker compose restart backend
```
Jika Anda mengubah konfigurasi Nginx (Frontend):
```bash
docker compose restart frontend
```

### 4. Menarik Kode Terbaru dari Github (Update Server)
Jika Anda dan tim (atau AI) memperbarui kode melalui Github, ikuti cara ini untuk menyinkronkan server produksi. Karena server diatur manual via SSH (bukan setup Git langsung), gunakan `pscp` dari Windows ke Ubuntu Anda.
Atau jika server sudah disetup sebagai *git clone*, jalankan:
```bash
# Tarik kode terbaru
git pull origin main

# Restart kontainer untuk menerapkan kode
docker compose down
docker compose up -d
```

### 5. Mematikan Seluruh Sistem
Jika ingin menghentikan sementara seluruh aktivitas (namun data di database tidak akan hilang karena kita menggunakan *Docker Volumes*):
```bash
docker compose down
```

---

## 🔒 5. Praktik Keamanan yang Disarankan
- **Ubah Password Default:** Segera ubah kredensial pgAdmin default di dalam file `docker-compose.yml`.
- **Rotasi Key:** Jangan pernah membagikan nilai `MEILISEARCH_MASTER_KEY` kepada publik, pastikan nilainya panjang dan rumit (minimal 16 karakter).
- **Setup HTTPS:** Gunakan Cloudflare (Proxy) atau certbot/LetsEncrypt untuk Nginx agar koneksi terlindungi dari penyadapan.

***
**Terakhir Diperbarui:** Juli 2026
**Penulis:** AI Commerce OS Infrastructure Team
