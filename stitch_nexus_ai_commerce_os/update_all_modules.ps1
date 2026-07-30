# Script batch untuk mengganti data dummy di semua modul code.html
# Data riil berbahasa Indonesia untuk bisnis reseller gadget

$base = "d:\RESELLER\stitch_nexus_ai_commerce_os"

# === AI Price Optimizer ===
$file = "$base\ai_price_optimizer\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 71\.500\.000', 'Rp 847.650.000'
$content = $content -replace '\+12\.5%', '+18.3%'
$content = $content -replace '45/50', '892/950'
$content = $content -replace '90% produk teroptimasi', '93,9% produk teroptimasi'
$content = $content -replace '>128<', '>347<'
$content = $content -replace 'perubahan harga hari ini', 'penyesuaian harga hari ini'
$content = $content -replace 'Sony WH-1000XM5', 'iPhone 16 Pro Max 256GB'
$content = $content -replace '>Audio<', '>Smartphone<'
$content = $content -replace 'Rp 4\.500\.000', 'Rp 21.499.000'
$content = $content -replace 'Rp 4\.750\.000', 'Rp 21.999.000'
$content = $content -replace '\+5\.6%', '+2.3%'
$content = $content -replace 'Samsung Galaxy S24', 'Samsung Galaxy S25 Ultra'
$content = $content -replace 'Rp 12\.000\.000', 'Rp 19.999.000'
$content = $content -replace 'Rp 11\.500\.000', 'Rp 18.799.000'
$content = $content -replace '\-4\.2%', '-6.0%'
$content = $content -replace 'MacBook Air M3', 'MacBook Air M4 15"'
$content = $content -replace 'Rp 18\.000\.000', 'Rp 22.499.000'
$content = $content -replace 'Rp 18\.250\.000', 'Rp 22.999.000'
$content = $content -replace '\+1\.4%', '+2.2%'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: ai_price_optimizer"

# === Laporan Keuangan ===
$file = "$base\laporan_keuangan_laba_rugi_otomatis\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 482\.500\.000', 'Rp 847.650.000'
$content = $content -replace 'Rp 124\.850\.000', 'Rp 536.200.000'
$content = $content -replace 'Rp 357\.650\.000', 'Rp 311.450.000'
$content = $content -replace 'MARGIN: 74\.1%', 'MARGIN: 36,7%'
$content = $content -replace 'w-\[74%\]', 'w-[37%]'
$content = $content -replace '\+14\.2%', '+17.8%'
$content = $content -replace '\-3\.1%', '+8.4%'
$content = $content -replace 'Efisiensi biaya meningkat <span class="text-tertiary font-bold">12%</span> karena optimasi fulfillment otomatis bulan ini\.', 'Margin naik <span class="text-tertiary font-bold">3,2%</span> dibanding Juni. Efisiensi ongkir via Gudang Surabaya menghemat Rp 18,5jt bulan ini.'
$content = $content -replace '1 Okt 2023 - 31 Okt 2023', '1 Juli 2026 - 29 Juli 2026'
$content = $content -replace '>482\.500\.000<', '>847.650.000<'
$content = $content -replace '>\(241\.250\.000\)<', '>(423.825.000)<'
$content = $content -replace '>\(48\.250\.000\)<', '>(67.812.000)<'
$content = $content -replace '>\(24\.125\.000\)<', '>(25.429.500)<'
$content = $content -replace '>\(11\.225\.000\)<', '>(19.133.500)<'
$content = $content -replace '>157\.650\.000<', '>311.450.000<'
$content = $content -replace '>32\.7%<', '>36,7%<'
$content = $content -replace '>2\.3%<', '>2,3%<'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: laporan_keuangan"

# === Mesin Afiliasi ===
$file = "$base\mesin_afiliasi_affiliate_engine\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp12\.482\.500', 'Rp57.100.000'
$content = $content -replace '\+14,2% dari siklus lalu', '+22,8% dari siklus lalu'
$content = $content -replace 'Rp1\.240\.000', 'Rp4.850.000'
$content = $content -replace '24 OKT 2023', '5 AGS 2026'
$content = $content -replace 'Keyboard Matrix G-Series', 'iPhone 16 Pro Max 256GB'
$content = $content -replace 'aff\.os/mx-g-72', 'aff.os/iph16pm-72'
$content = $content -replace '2,4RB KLIK', '18,7RB KLIK'
$content = $content -replace '\+Rp412\.000', '+Rp8.540.000'
$content = $content -replace 'AeroSound Max Pro', 'Samsung Galaxy S25 Ultra'
$content = $content -replace 'aff\.os/aero-mx', 'aff.os/s25u-mx'
$content = $content -replace '1,1RB KLIK', '12,3RB KLIK'
$content = $content -replace '\+Rp189\.200', '+Rp5.120.000'
$content = $content -replace '1,2RB', '4,6RB'
$content = $content -replace '>840<', '>2.840<'
$content = $content -replace '12,5RB', '38,2RB'
$content = $content -replace '>312<', '>1.371<'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: mesin_afiliasi"

# === Customer Intelligence Hub ===
$file = "$base\customer_intelligence_hub\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 8\.2M', 'Rp 9,8jt'
$content = $content -replace 'Rp 12\.4M', 'Rp 15,2jt'
$content = $content -replace 'Rp 4\.2M', 'Rp 6,7jt'
$content = $content -replace 'Rp 1\.1M', 'Rp 1,8jt'
$content = $content -replace '18\.4 Mo', '16,7 Bln'
$content = $content -replace '\+2\.1% MoM', '+3,4% MoM'
$content = $content -replace '\+14\.5% YoY', '+18,2% YoY'
$content = $content -replace '3\.2 Mo', '2,8 Bln'
$content = $content -replace '>12,840 Units<', '>24.680 Unit<'
$content = $content -replace '8\.2k Visits', '18,4rb Kunjungan'
$content = $content -replace 'Conversion: 12%', 'Konversi: 14,7%'
$content = $content -replace '984 Threads', '2.847 Thread'
$content = $content -replace 'Resp\. Time: &lt;2m', 'Waktu Respon: &lt;90dtk'
$content = $content -replace '642 Accounts', '1.892 Akun'
$content = $content -replace 'Valid: 94%', 'Valid: 96,8%'
$content = $content -replace '588 Active', '1.245 Aktif'
$content = $content -replace 'ARPU: Rp 450k', 'ARPU: Rp 680rb'
$content = $content -replace '>1,120<', '>1.892<'
$content = $content -replace '>2,450<', '>4.120<'
$content = $content -replace '>812<', '>1.340<'
$content = $content -replace 'LTV Prediction Matrix', 'Matriks Prediksi Nilai Pelanggan'
$content = $content -replace 'Customer Segments', 'Segmen Pelanggan'
$content = $content -replace 'Avg\. Life Cycle', 'Siklus Rata-Rata'
$content = $content -replace 'Expected LTV', 'Prediksi LTV'
$content = $content -replace 'CAC Recovery', 'Pengembalian CAC'
$content = $content -replace 'Champions', 'Juara Belanja'
$content = $content -replace 'Recent &amp; High Freq', 'Sering &amp; Baru Belanja'
$content = $content -replace 'Growing Potentials', 'Potensi Berkembang'
$content = $content -replace 'High Avg\. Basket', 'Keranjang Rata-Rata Tinggi'
$content = $content -replace 'At Risk', 'Beresiko Churn'
$content = $content -replace 'Lapsed &gt; 60 Days', 'Tidak Aktif &gt; 60 Hari'
$content = $content -replace 'Enroll Rewards', 'Daftarkan Reward'
$content = $content -replace 'Upsell Trigger', 'Picu Upsell'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: customer_intelligence_hub"

# === AI Business Coach ===
$file = "$base\ai_business_coach_saran_bisnis\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 42\.850\.000', 'Rp 311.450.000'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: ai_business_coach"

# === Model Produk Universal ===
$file = "$base\model_produk_universal\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 3\.599\.000', 'Rp 21.499.000'
$content = $content -replace 'Rp 3\.499\.000', 'Rp 19.999.000'
$content = $content -replace 'Rp 4\.2B', 'Rp 847,6jt'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: model_produk_universal"

# === Supplier Fulfillment Hub ===
$file = "$base\supplier_fulfillment_hub\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 187\.2jt', 'Rp 847,6jt'
$content = $content -replace 'Rp 61\.8jt', 'Rp 312,5jt'
$content = $content -replace 'Rp 2\.985\.000', 'Rp 21.499.000'
$content = $content -replace 'Rp 6\.750\.000', 'Rp 19.999.000'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: supplier_fulfillment_hub"

# === Sistem Notifikasi WA Telegram ===
$file = "$base\sistem_notifikasi_wa_telegram\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace [regex]::Escape('Order Baru! #RH-9021 untuk Budi (Rp 250.000) sedang diproses...'), 'Pesanan Baru! #INV-20260729-011 untuk Rendra Wijaya (Rp 21.499.000) — iPhone 16 Pro Max sedang diproses...'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: sistem_notifikasi"

# === SaaS White Label Center ID ===
$file = "$base\saas_white_label_center_id\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 1\.4B', 'Rp 847,6jt'
$content = $content -replace '\+12\.4%', '+17,8%'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: saas_white_label_center_id"

# === Portal Mandiri Sub Reseller ===
$file = "$base\portal_mandiri_untuk_sub_reseller\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 4\.250\.000', 'Rp 18.750.000'
$content = $content -replace 'Rp 12\.999k', 'Rp 42.850rb'
$content = $content -replace 'Rp 2\.450k', 'Rp 8.760rb'
$content = $content -replace 'Rp 4\.100k', 'Rp 15.320rb'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: portal_mandiri"

# === Pabrik Konten AI ===
$file = "$base\pabrik_konten_ai\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 4\.2M', 'Rp 42,3jt'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: pabrik_konten_ai"

# === Pabrik Konten AI ID ===
$file = "$base\pabrik_konten_ai_id\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 4\.2M', 'Rp 42,3jt'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: pabrik_konten_ai_id"

# === Aturan Margin Otomatis ===
$file = "$base\aturan_margin_otomatis_rule_engine\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 1\.250\.000', 'Rp 17.499.000'
$content = $content -replace '\+Rp 275\.000', '+Rp 4.375.000'
$content = $content -replace 'Rp 1\.525\.000', 'Rp 21.874.000'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: aturan_margin_otomatis"

# === Universal Order Engine ===
$file = "$base\universal_order_engine_pusat_pesanan\code.html"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Rp 450\.000', 'Rp 21.499.000'
$content = $content -replace 'Rp 1\.250\.000', 'Rp 19.999.000'
$content = $content -replace 'Rp 89\.000', 'Rp 5.299.000'
$content | Set-Content $file -Encoding UTF8
Write-Host "Updated: universal_order_engine"

Write-Host "`nSemua modul telah diperbarui dengan data riil!"
