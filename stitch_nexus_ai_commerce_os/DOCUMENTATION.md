# AI Commerce OS — Dokumentasi Instalasi & Deployment

Dokumen ini menjelaskan cara menjalankan sistem ini dari nol (development) sampai
production, plus status jujur: modul mana yang **sudah benar-benar berfungsi**
dan mana yang **masih butuh setup eksternal** (App Review Meta/TikTok, dsb).

---

## 1. Arsitektur Sistem

```
                        ┌─────────────┐
                        │   Nginx     │  :80  (frontend statis)
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   Backend    │  :3000→5000  (Express API)
                        │  (server.js) │
                        └──┬───┬───┬──┘
             ┌─────────────┘   │   └─────────────┐
      ┌──────▼─────┐    ┌──────▼─────┐    ┌───────▼──────┐
      │  Postgres   │    │ Meilisearch │    │    Redis     │
      │   :5432     │    │    :7700    │    │    :6379     │
      └─────────────┘    └────────────┘    └──────────────┘

      ┌─────────────┐
      │  RabbitMQ   │  :5672 / :15672 (event bus)
      │ (eventbus)  │
      └──┬───┬───┬──┘
         │   │   │
   ┌─────▼─┐ ┌▼──────┐ ┌▼─────────┐ ┌────────┐
   │WhatsApp│ │ Email │ │ Payments │ │Scheduler│  ┌────────┐
   │(Twilio)│ │(SendGr)│ │ (Stripe) │ │ (cron)  │  │Webhook │
   └────────┘ └────────┘ └──────────┘ └─────────┘  └────────┘
```

**Layanan tambahan:** `erpdb` (Postgres terpisah untuk data ERP), `pgadmin`
(UI database, opsional, disable di production kalau tidak perlu).

---

## 2. Prasyarat

- Docker & Docker Compose v2
- Node.js 20+ (kalau mau jalankan tanpa Docker / development lokal)
- Akses ke server tujuan deploy (di dokumen ini contoh: `192.168.1.18`)
- Akun developer yang HARUS didaftarkan manual sebelum modul terkait aktif penuh:
  - developers.tiktok.com (Content Posting API + TikTok Shop Open API — dua app berbeda)
  - developers.facebook.com (Instagram Graph API)
  - Twilio (WhatsApp)
  - SendGrid (Email)
  - Stripe (Payments internasional) / Gopay (Payments lokal)
  - Google AI Studio (Gemini API — untuk generate caption/konten otomatis)

---

## 3. Instalasi — Development Lokal (tanpa Docker)

```bash
git clone <repo-anda> ai-commerce-os
cd ai-commerce-os/stitch_nexus_ai_commerce_os

cp .env.example .env
# edit .env, isi minimal DB_* dan MEILI_MASTER_KEY untuk bisa jalan

cd backend
npm install
npm run dev          # nodemon, auto-reload
```

Backend akan otomatis membuat semua tabel (`CREATE TABLE IF NOT EXISTS` +
`ALTER TABLE ADD COLUMN IF NOT EXISTS`) saat pertama kali start — **tidak perlu
migration file terpisah**, cukup pastikan Postgres sudah bisa diakses lewat
`DATABASE_URL`.

Untuk service pendukung (WhatsApp/Email/Payments/Scheduler/Webhook), masing-masing
punya `package.json` sendiri:

```bash
cd ../whatsapp && npm install && npm start   # port 5000
cd ../email && npm install && npm start      # port 5001
cd ../payments && npm install && npm start   # port 5002
cd ../scheduler && npm install && npm start
cd ../webhook && npm install && npm start    # port 4000
```

Service-service ini butuh RabbitMQ jalan duluan (`docker run -p 5672:5672 -p 15672:15672 rabbitmq:3-management`).

---

## 4. Instalasi — Docker Compose (direkomendasikan)

```bash
cd stitch_nexus_ai_commerce_os
cp .env.example .env
nano .env    # WAJIB isi DB_PASSWORD, MEILI_MASTER_KEY, PGADMIN_PASSWORD, ERP_DB_PASSWORD
             # dengan password kuat — jangan pakai nilai contoh di file

docker compose up -d --build
docker compose ps        # pastikan semua "Up"
docker compose logs -f backend   # cek log real-time
```

Akses setelah jalan:
| Layanan | URL |
|---|---|
| Frontend | http://192.168.1.18/ |
| Backend API | http://192.168.1.18:5000/api/... |
| Meilisearch | http://192.168.1.18:7700 |
| RabbitMQ Management | http://192.168.1.18:15672 (guest/guest — **ganti di production!**) |
| pgAdmin | http://192.168.1.18:5050 |

---

## 5. Status Modul — Jujur, Apa yang Sudah Nyata vs Belum

| Modul | Status | Syarat supaya 100% jalan |
|---|---|---|
| Scraping marketplace (Tokopedia/Shopee/Lazada/Blibli/Zalora/TikTok) | ✅ **Nyata** | Tidak ada, sudah jalan (scraping publik) |
| Order management, product DB | ✅ **Nyata** | Tidak ada |
| Auto-post **TikTok** (video) | ✅ **Nyata**, siap pakai | Daftar App di developers.tiktok.com, isi `TIKTOK_CONTENT_CLIENT_KEY/SECRET` di `.env`, lalu buka `/api/social/tiktok/connect` |
| Auto-post **Instagram** (foto/reels) | ✅ **Nyata**, siap pakai | Meta App + App Review disetujui, isi `INSTAGRAM_APP_ID/SECRET`, buka `/api/social/instagram/connect` |
| WhatsApp notifikasi | ✅ **Nyata** (Twilio) | Isi `TWILIO_ACCOUNT_SID/AUTH_TOKEN` asli |
| Email notifikasi | ✅ **Nyata** (SendGrid) | Isi `SENDGRID_API_KEY` asli |
| Payment Stripe | ✅ **Nyata** | Isi `STRIPE_SECRET_KEY` asli |
| Payment Gopay | ⚠️ Kode ada, endpoint asli dikomentari | Perlu kredensial Gopay Merchant asli + uncomment saat siap produksi |
| Dashboard UI (30+ halaman `code.html`) | ⚠️ **Prototype visual** (hasil desain Stitch) | Efek grafik/toast di dashboard adalah simulasi tampilan, TIDAK merepresentasikan data real-time — halaman ini cocok untuk demo/preview desain, bukan dashboard produksi |
| ERP sync | ⚠️ Mock | Belum ada sistem ERP nyata yang dituju — perlu spesifikasi ERP target dulu |

**Kalau credential belum diisi**, service TIDAK berpura-pura sukses — dia akan
mencatat `⚠️ SIMULASI` di log dan post ditandai gagal (`FAILED`) dengan alasan
jelas di kolom `failure_reason`, supaya Anda selalu tahu status sebenarnya.

---

## 6. Cara Connect Akun TikTok & Instagram

### TikTok (@skuypergibelanja)
1. developers.tiktok.com → buat app → tambah produk **Content Posting API** → ajukan review.
2. Setelah disetujui, isi `.env`: `TIKTOK_CONTENT_CLIENT_KEY`, `TIKTOK_CONTENT_CLIENT_SECRET`.
3. Restart backend, lalu buka **http://192.168.1.18/api/social/tiktok/connect** di browser, login sebagai akun @skuypergibelanja, approve izin.
4. Token otomatis tersimpan — cek tabel `api_keys` platform `TikTok Content Posting`.

### Instagram (@skuypergibelanja)
1. Ubah akun IG jadi Business/Creator, tautkan ke Facebook Page.
2. developers.facebook.com → buat app Business → tambah produk **Instagram Graph API** → ajukan App Review untuk `instagram_business_content_publish`.
3. Isi `.env`: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`.
4. Buka **http://192.168.1.18/api/social/instagram/connect**, login pakai akun Facebook yang mengelola Page terkait, approve izin.

### Membuat jadwal posting
```
POST /api/social/schedule
{
  "caption": "Promo hari ini! 🔥",
  "platforms": ["tiktok", "instagram"],
  "scheduled_at": "2026-08-04T10:00:00Z",
  "video_path": "/app/uploads/promo1.mp4",   // wajib untuk TikTok
  "image_url": "https://domain-anda.com/promo1.jpg"  // untuk IG foto (harus URL publik, bukan file lokal)
}
```
Approve lewat `PATCH /api/social/schedule/:id/approve` → cron job tiap 1 menit
akan publish otomatis begitu `scheduled_at` tercapai.

---

## 7. Checklist Keamanan Sebelum Production

- [ ] Ganti SEMUA password default di `.env` (`DB_PASSWORD`, `MEILI_MASTER_KEY`, `PGADMIN_PASSWORD`, `ERP_DB_PASSWORD`)
- [ ] Ganti user/password default RabbitMQ (`guest`/`guest`) di `docker-compose.yml`
- [ ] Pastikan `.env` ada di `.gitignore` (sudah ditambahkan) — **jangan pernah commit atau tempel di chat**
- [ ] Kalau server ini akan diakses dari internet (bukan cuma LAN), pasang reverse proxy + HTTPS (mis. Caddy/Nginx + Let's Encrypt), dan **jangan expose port database (5432, 6379, 7700, 5672) langsung ke publik** — hapus mapping port-nya di `docker-compose.yml`, cukup diakses lewat network internal Docker
- [ ] Set `privacy_level` TikTok dari `SELF_ONLY` ke `PUBLIC_TO_EVERYONE` HANYA setelah app lolos audit publik TikTok
- [ ] Rotate ulang semua key yang pernah diketik di chat/tempat tidak aman

---

## 8. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `docker compose up` gagal build `email`/`payments` | Versi lama tidak punya folder ini | Pastikan pakai source code hasil perbaikan ini |
| Backend crash langsung saat start | Ada `SyntaxError` di server.js (bug lama sudah diperbaiki) | Jalankan `node --check backend/server.js` untuk verifikasi |
| Post status jadi `FAILED` | Lihat kolom `failure_reason` di tabel `social_posts` — biasanya token belum connect atau video_path/image_url kosong | Connect ulang via `/api/social/<platform>/connect` |
| TikTok publish gagal `spam_risk_too_many_posts` | Rate limit TikTok | Kurangi frekuensi posting, tunggu beberapa jam |
| Instagram publish gagal `media type not supported` | `video_url`/`image_url` tidak bisa diakses publik oleh server Meta | Pastikan URL bisa dibuka tanpa login dari luar |

---

## 9. Yang Masih Perlu Dikerjakan (belum ada di scope ini)

- Endpoint upload file video lokal → dapat `video_path`/`video_url` (sekarang asumsi file sudah ada di server / URL sudah publik)
- Rewrite 30+ halaman dashboard (`code.html`) dari prototype visual jadi dashboard yang benar-benar fetch data live dari backend (saat ini murni tampilan hasil desain Stitch)
- Integrasi Gopay produksi (endpoint asli masih dikomentari, perlu kredensial merchant asli)
- Sistem ERP nyata sebagai tujuan sinkronisasi (saat ini endpoint `/api/erp/sync` masih placeholder)
