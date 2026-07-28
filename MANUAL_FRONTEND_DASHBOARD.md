# 🖥️ Panduan Penggunaan Frontend AI Commerce OS (Dashboard Utama)

Panduan ini ditujukan untuk operator, admin, atau sub-reseller yang mengakses **AI Commerce OS** melalui antarmuka web di `http://192.168.1.18/`. 

Dashboard ini adalah pusat kendali (Command Center) dari seluruh ekosistem bisnis Anda. Berikut adalah penjelasan modul-modul yang tersedia dan cara menggunakannya.

---

## 🧭 Navigasi Utama (Dashboard - index.html)

Saat pertama kali membuka `http://192.168.1.18/`, Anda akan disambut oleh **Dashboard Eksekutif**. Halaman ini menyajikan metrik penting secara *real-time*, seperti total pendapatan, pesanan baru, kepuasan pelanggan, dan notifikasi dari sistem AI.

Dari sini, Anda bisa berpindah ke berbagai modul melalui Menu Navigasi di sebelah kiri (atau ikon menu di HP).

---

## 📦 1. Modul Manajemen Pesanan & Stok
**(Universal Order Engine)**

Modul ini adalah jantung dari operasional toko Anda. Karena sistem ini adalah *aggregator*, semua pesanan dari berbagai platform terkumpul di sini.

- **Fitur Utama:**
  - Melihat pesanan masuk dari berbagai platform (Tokopedia, Shopee, TikTok Shop, dll) dalam satu layar.
  - Memantau status stok barang.
  - Integrasi otomatis dengan *Supplier Fulfillment Hub* (jika barang habis, sistem dapat otomatis meneruskan pesanan ke *supplier* dropship).
- **Cara Menggunakan:**
  - Klik **"Pesanan"** di menu navigasi.
  - Gunakan filter di bagian atas untuk menyortir pesanan berdasarkan status (Baru, Diproses, Dikirim, Selesai).
  - Klik pada salah satu pesanan untuk melihat detail pembeli, alamat, dan mencetak label pengiriman.

---

## 🧠 2. Modul Pusat Kecerdasan (Intelligence Hub)
**(Market Intelligence Engine & AI Business Coach)**

AI Commerce OS tidak hanya mencatat transaksi, tetapi juga menganalisis tren pasar.

- **Fitur Utama:**
  - **Market Intelligence:** Menganalisis produk apa yang sedang *trending* dan laris di Shopee, Tokopedia, dan TikTok Shop berdasarkan data hasil *scraping* harian.
  - **AI Business Coach:** Memberikan saran otomatis. (Contoh: *"Produk Skincare X sedang tren, sebaiknya Anda menambah stok"*, atau *"Harga Anda lebih mahal 5% dari kompetitor di Shopee"*).
- **Cara Menggunakan:**
  - Buka modul **Intelligence Hub**.
  - Lihat grafik tren penjualan dan rekomendasi AI.
  - Klik **"Terapkan Saran"** jika AI menyarankan penyesuaian harga (AI Price Optimizer).

---

## 💬 3. Modul Customer Support AI Chatbot
**(Layanan Pelanggan Otomatis)**

Anda tidak perlu membalas pesan pelanggan satu per satu 24/7.

- **Fitur Utama:**
  - Chatbot AI yang merespons pertanyaan pelanggan tentang stok, ukuran, resi pengiriman, hingga keluhan barang rusak.
  - Bot dilatih khusus dengan data toko Anda.
  - Jika bot tidak bisa menjawab, tiket akan diteruskan ke agen manusia (Anda).
- **Cara Menggunakan:**
  - Masuk ke modul **Customer Support AI**.
  - Di sini Anda dapat memantau percakapan langsung antara Bot dan pelanggan.
  - Anda dapat mengambil alih (*takeover*) obrolan kapan saja dengan membalas langsung di kotak chat.

---

## 📢 4. Modul Pabrik Konten AI (AI Content Factory)
**(Marketing Auto Post Hub)**

Bosan membuat deskripsi produk dan konten sosial media? Biarkan AI yang melakukannya.

- **Fitur Utama:**
  - Membuat judul *clickbait*, deskripsi produk SEO-friendly, dan skrip video TikTok secara otomatis hanya dengan memasukkan kata kunci produk.
  - Fitur Auto-Post: Menjadwalkan postingan ke media sosial secara otomatis.
- **Cara Menggunakan:**
  - Masuk ke **Pabrik Konten AI**.
  - Ketik nama produk Anda (Misal: "Sepatu Lari Pria Original").
  - Pilih gaya bahasa (Santai, Profesional, Lucu).
  - Klik **"Generate Content"**. Sistem akan memunculkan teks yang siap Anda *copy-paste* ke Marketplace atau di-*publish* langsung.

---

## 💰 5. Modul Pusat Pendapatan & Afiliasi
**(Revenue Engine & Affiliate Center)**

Bagi Anda yang menggunakan sistem Reseller/Dropshipper atau Affiliate.

- **Fitur Utama:**
  - Laporan Keuangan Laba/Rugi Otomatis.
  - Mengelola *Sub-Reseller*.
  - Aturan Margin Otomatis (Markup Harga Otomatis).
- **Cara Menggunakan:**
  - Masuk ke **Affiliate Center**.
  - Anda bisa melihat daftar afiliator yang membantu mempromosikan barang Anda, serta total komisi yang harus dibayarkan.
  - Di tab **Keuangan**, Anda bisa mencetak laporan laba bersih bulanan dengan satu klik.

---

## 🛒 6. Modul Akusisi Data & Integrasi API
**(Data Acquisition Hub)**

Ini adalah modul di balik layar yang sangat kuat, berfungsi menarik data jutaan produk dari marketplace.

- **Fitur Utama:**
  - Mengelola koneksi ke ScraperAPI dan Marketplace API.
  - Mencari barang termurah lintas-platform (Lazada, Tokopedia, Shopee, Blibli, Zalora).
- **Cara Menggunakan:**
  - Modul ini biasanya berjalan otomatis.
  - Namun, Anda bisa memicu pencarian tren secara manual dengan masuk ke **API Hub** dan mengklik **"Sinkronisasi Data Marketplace Sekarang"**.

---

## ⚡ Tips Pintasan (Shortcut) Penggunaan:
- **Pencarian Cepat:** Gunakan *Search Bar* di bagian paling atas halaman `index.html` untuk mencari produk, nama pelanggan, atau nomor resi seketika (Didukung oleh Meilisearch yang anti-typo).
- **Notifikasi Darurat:** Perhatikan ikon Lonceng di sudut kanan atas. Notifikasi berwarna **Merah** menandakan adanya error scraping atau stok barang kritis yang harus segera di-*restock*.
- **Tema Gelap (Dark Mode):** Tersedia tombol transisi ke Dark Mode agar nyaman dipantau saat malam hari.

---
*Manual ini adalah dokumen hidup dan akan terus diperbarui seiring penambahan plugin (App Store Blueprint) di masa mendatang.*
