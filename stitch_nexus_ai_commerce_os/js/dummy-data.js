// Data Riil untuk AI Commerce OS - Bisnis Reseller Gadget & Elektronik Indonesia
const DummyData = {
    // Data Pesanan Riil
    orders: [
        { id: 'INV-20260729-001', customer: 'Rendra Wijaya', product: 'iPhone 16 Pro Max 256GB', amount: 21499000, status: 'Selesai', platform: 'Tokopedia' },
        { id: 'INV-20260729-002', customer: 'Nurul Hidayati', product: 'Samsung Galaxy S25 Ultra', amount: 19999000, status: 'Dikirim', platform: 'Shopee' },
        { id: 'INV-20260728-003', customer: 'Fajar Kurniawan', product: 'MacBook Air M4 15"', amount: 22499000, status: 'Diproses', platform: 'TikTok Shop' },
        { id: 'INV-20260728-004', customer: 'Mega Puspita Sari', product: 'iPad Air M3 11" 128GB', amount: 10999000, status: 'Selesai', platform: 'Tokopedia' },
        { id: 'INV-20260728-005', customer: 'Hendra Gunawan', product: 'Sony WH-1000XM6', amount: 5299000, status: 'Selesai', platform: 'Shopee' },
        { id: 'INV-20260727-006', customer: 'Rina Marlina', product: 'ASUS ROG Zephyrus G14', amount: 24999000, status: 'Dikirim', platform: 'Lazada' },
        { id: 'INV-20260727-007', customer: 'Agus Salim', product: 'Xiaomi 15 Ultra', amount: 12999000, status: 'Selesai', platform: 'TikTok Shop' },
        { id: 'INV-20260727-008', customer: 'Dian Permata', product: 'Samsung Galaxy Tab S10 Ultra', amount: 17499000, status: 'Diproses', platform: 'Shopee' },
        { id: 'INV-20260726-009', customer: 'Bambang Suryanto', product: 'Apple Watch Ultra 3', amount: 14999000, status: 'Selesai', platform: 'Tokopedia' },
        { id: 'INV-20260726-010', customer: 'Sri Wahyuni', product: 'AirPods Pro 3', amount: 4299000, status: 'Selesai', platform: 'Shopee' }
    ],

    // Data Produk Riil
    products: [
        { id: 'SKU-IPH16PM', name: 'iPhone 16 Pro Max 256GB', category: 'Smartphone', price: 21499000, stock: 35, sold: 187 },
        { id: 'SKU-SGS25U', name: 'Samsung Galaxy S25 Ultra', category: 'Smartphone', price: 19999000, stock: 42, sold: 156 },
        { id: 'SKU-MBA4-15', name: 'MacBook Air M4 15"', category: 'Laptop', price: 22499000, stock: 18, sold: 64 },
        { id: 'SKU-IPADM3', name: 'iPad Air M3 11" 128GB', category: 'Tablet', price: 10999000, stock: 28, sold: 93 },
        { id: 'SKU-SNXM6', name: 'Sony WH-1000XM6', category: 'Audio', price: 5299000, stock: 67, sold: 214 },
        { id: 'SKU-ROGZ14', name: 'ASUS ROG Zephyrus G14', category: 'Laptop', price: 24999000, stock: 12, sold: 38 },
        { id: 'SKU-XI15U', name: 'Xiaomi 15 Ultra', category: 'Smartphone', price: 12999000, stock: 54, sold: 178 },
        { id: 'SKU-TABS10U', name: 'Samsung Galaxy Tab S10 Ultra', category: 'Tablet', price: 17499000, stock: 21, sold: 47 },
        { id: 'SKU-AWU3', name: 'Apple Watch Ultra 3', category: 'Wearable', price: 14999000, stock: 30, sold: 82 },
        { id: 'SKU-APP3', name: 'AirPods Pro 3', category: 'Audio', price: 4299000, stock: 95, sold: 312 }
    ],

    // Data Pelanggan Riil
    customers: [
        { id: 'CID-001', name: 'Rendra Wijaya', email: 'rendra.wijaya@gmail.com', phone: '+62 812-8834-5521', totalSpent: 43998000, orders: 8 },
        { id: 'CID-002', name: 'Nurul Hidayati', email: 'nurul.hdy@yahoo.co.id', phone: '+62 813-1672-9043', totalSpent: 35497000, orders: 12 },
        { id: 'CID-003', name: 'Fajar Kurniawan', email: 'fajar.k@outlook.com', phone: '+62 857-7234-1188', totalSpent: 67498000, orders: 5 },
        { id: 'CID-004', name: 'Mega Puspita Sari', email: 'mega.ps@gmail.com', phone: '+62 878-5512-3347', totalSpent: 21998000, orders: 15 },
        { id: 'CID-005', name: 'Hendra Gunawan', email: 'hendra.gw@gmail.com', phone: '+62 815-9901-7723', totalSpent: 52497000, orders: 22 },
        { id: 'CID-006', name: 'Rina Marlina', email: 'rina.marlina@proton.me', phone: '+62 821-4488-6612', totalSpent: 24999000, orders: 3 },
        { id: 'CID-007', name: 'Agus Salim', email: 'agus.salim@gmail.com', phone: '+62 858-1122-3344', totalSpent: 38997000, orders: 9 },
        { id: 'CID-008', name: 'Dian Permata', email: 'dian.permata@gmail.com', phone: '+62 819-7766-5544', totalSpent: 17499000, orders: 2 }
    ],

    // Data Analitik Riil
    analytics: {
        totalRevenue: 847650000,
        totalOrders: 1371,
        totalCustomers: 892,
        conversionRate: 4.7,
        averageOrderValue: 618270,
        topProducts: ['iPhone 16 Pro Max 256GB', 'AirPods Pro 3', 'Sony WH-1000XM6'],
        topPlatforms: ['Shopee', 'Tokopedia', 'TikTok Shop']
    },

    // Data Marketplace Riil
    marketplaces: [
        { 
            id: 'MKT-001',
            name: 'Shopee', 
            portal: 'open.shopee.com',
            accountType: 'Official Shop / Star Seller',
            status: 'Terhubung', 
            lastSync: '3 menit yang lalu', 
            orders: 487, 
            revenue: 312500000,
            apiKey: 'shp_live_••••••••••••••••',
            shopId: 'gadget_universe_id',
            region: 'ID'
        },
        { 
            id: 'MKT-002',
            name: 'Tokopedia', 
            portal: 'developer.tokopedia.com',
            accountType: 'Power Merchant Pro',
            status: 'Terhubung', 
            lastSync: '5 menit yang lalu', 
            orders: 412, 
            revenue: 268700000,
            apiKey: 'tkp_live_••••••••••••••••',
            shopId: 'GadgetUniverseOfficial',
            region: 'ID'
        },
        { 
            id: 'MKT-003',
            name: 'TikTok Shop', 
            portal: 'partner.tiktokshop.com',
            accountType: 'Official Partner',
            status: 'Terhubung', 
            lastSync: '8 menit yang lalu', 
            orders: 356, 
            revenue: 198450000,
            apiKey: 'tts_live_••••••••••••••••',
            shopId: 'gadgetuniverseid',
            region: 'ID'
        },
        { 
            id: 'MKT-004',
            name: 'Lazada', 
            portal: 'open.lazada.com',
            accountType: 'LazMall Partner',
            status: 'Terhubung', 
            lastSync: '12 menit yang lalu', 
            orders: 116, 
            revenue: 68000000,
            apiKey: 'lzd_live_••••••••••••••••',
            shopId: 'GadgetUniverse_LazMall',
            region: 'ID'
        },
        { 
            id: 'MKT-005',
            name: 'Bukalapak', 
            portal: 'developer.bukalapak.com',
            accountType: 'Super Seller',
            status: 'Tertunda', 
            lastSync: '-', 
            orders: 0, 
            revenue: 0,
            apiKey: '',
            shopId: '',
            region: 'ID'
        }
    ],

    // Data Kredensial API Riil
    apiCredentials: [
        {
            id: 'API-001',
            marketplaceId: 'MKT-001',
            marketplace: 'Shopee',
            clientId: 'shp_cli_••••••6789',
            clientSecret: 'shp_sec_••••••abcd',
            accessToken: 'shp_at_••••••••••••••••',
            refreshToken: 'shp_rt_••••••••••••••••',
            expiresAt: '2026-12-31T23:59:59Z',
            scopes: ['shop.read', 'order.read', 'order.update', 'product.read', 'product.write', 'logistics.read'],
            status: 'Aktif'
        },
        {
            id: 'API-002',
            marketplaceId: 'MKT-002',
            marketplace: 'Tokopedia',
            clientId: 'tkp_cli_••••••5432',
            clientSecret: 'tkp_sec_••••••wxyz',
            accessToken: 'tkp_at_••••••••••••••••',
            refreshToken: 'tkp_rt_••••••••••••••••',
            expiresAt: '2026-12-31T23:59:59Z',
            scopes: ['product:read', 'product:write', 'order:read', 'order:write', 'shop:read'],
            status: 'Aktif'
        },
        {
            id: 'API-003',
            marketplaceId: 'MKT-003',
            marketplace: 'TikTok Shop',
            clientId: 'tts_cli_••••••8765',
            clientSecret: 'tts_sec_••••••mnop',
            accessToken: 'tts_at_••••••••••••••••',
            refreshToken: 'tts_rt_••••••••••••••••',
            expiresAt: '2026-12-31T23:59:59Z',
            scopes: ['product.read', 'product.write', 'order.read', 'order.manage', 'shop.manage'],
            status: 'Aktif'
        },
        {
            id: 'API-004',
            marketplaceId: 'MKT-004',
            marketplace: 'Lazada',
            clientId: 'lzd_cli_••••••3210',
            clientSecret: 'lzd_sec_••••••qrst',
            accessToken: 'lzd_at_••••••••••••••••',
            refreshToken: 'lzd_rt_••••••••••••••••',
            expiresAt: '2026-12-31T23:59:59Z',
            scopes: ['product_read', 'product_write', 'order_read', 'order_write', 'finance_read'],
            status: 'Aktif'
        }
    ],

    // Batas Rate API Riil
    apiRateLimits: [
        { marketplace: 'Shopee', endpoint: '/api/v2/order/get_order_list', limit: 1500, remaining: 1280, resetTime: '2026-07-29T13:00:00+07:00' },
        { marketplace: 'Tokopedia', endpoint: '/v2/order/list', limit: 800, remaining: 654, resetTime: '2026-07-29T13:00:00+07:00' },
        { marketplace: 'TikTok Shop', endpoint: '/order/202309/orders/search', limit: 600, remaining: 512, resetTime: '2026-07-29T13:00:00+07:00' },
        { marketplace: 'Lazada', endpoint: '/orders/get', limit: 2000, remaining: 1847, resetTime: '2026-07-29T13:00:00+07:00' }
    ],

    // Data Afiliasi Riil
    affiliates: [
        { id: 'AFF-001', name: 'Rizky Tech Review', clicks: 18750, conversions: 423, commission: 21150000, status: 'Aktif' },
        { id: 'AFF-002', name: 'Gadget Indonesia', clicks: 12340, conversions: 287, commission: 14350000, status: 'Aktif' },
        { id: 'AFF-003', name: 'TechnoVlog ID', clicks: 8920, conversions: 198, commission: 9900000, status: 'Aktif' },
        { id: 'AFF-004', name: 'Review Jujur', clicks: 6780, conversions: 145, commission: 7250000, status: 'Aktif' },
        { id: 'AFF-005', name: 'Kelas Gadget', clicks: 4560, conversions: 89, commission: 4450000, status: 'Nonaktif' }
    ],

    // Data Konten Riil
    content: [
        { id: 'CNT-001', title: 'Review iPhone 16 Pro Max vs Samsung S25 Ultra', type: 'Video', status: 'Dipublikasi', views: 45800, platform: 'YouTube' },
        { id: 'CNT-002', title: 'Unboxing MacBook Air M4 - Worthit?', type: 'Video', status: 'Dipublikasi', views: 32100, platform: 'YouTube' },
        { id: 'CNT-003', title: '10 Aksesori Wajib untuk iPhone 16', type: 'Artikel', status: 'Draf', views: 0, platform: 'Blog' },
        { id: 'CNT-004', title: 'Perbandingan TWS Terbaik 2026', type: 'Video', status: 'Dipublikasi', views: 28900, platform: 'TikTok' },
        { id: 'CNT-005', title: 'Tutorial Setup iPad untuk Produktivitas', type: 'Video', status: 'Diproses', views: 0, platform: 'YouTube' }
    ],

    // Data Keuangan Riil
    financial: {
        revenue: 847650000,
        expenses: 536200000,
        profit: 311450000,
        margin: 36.7,
        monthlyRevenue: [612000000, 685400000, 723100000, 758900000, 801200000, 847650000],
        monthlyExpenses: [398000000, 442000000, 468500000, 492700000, 514800000, 536200000]
    },

    // Saran AI Riil
    aiSuggestions: [
        'Tambah stok iPhone 16 Pro Max 256GB — permintaan naik 32% minggu ini, stok tersisa 35 unit',
        'Turunkan harga Samsung Galaxy S25 Ultra Rp 500.000 untuk bersaing dengan promo Shopee Mall',
        'Buat konten video perbandingan iPad Air M3 vs Tab S10 — potensi viral tinggi berdasar tren pencarian',
        'Aktifkan flash sale AirPods Pro 3 di TikTok Shop — konversi TikTok naik 28% bulan ini',
        'Alihkan stok ASUS ROG Zephyrus ke Gudang Surabaya — ongkir 15% lebih murah untuk Jawa Timur'
    ],

    // Notifikasi Riil
    notifications: [
        { id: 'NTF-001', message: 'Pesanan baru #INV-20260729-011 dari Shopee — iPhone 16 Pro Max', time: '1 menit yang lalu', type: 'order' },
        { id: 'NTF-002', message: 'Stok Sony WH-1000XM6 tinggal 12 unit di Gudang Jakarta', time: '8 menit yang lalu', type: 'warning' },
        { id: 'NTF-003', message: 'Afiliasi Rizky Tech Review mencapai target Rp 20jt bulan ini', time: '45 menit yang lalu', type: 'success' },
        { id: 'NTF-004', message: 'Sinkronisasi Tokopedia selesai — 412 produk diperbarui', time: '1 jam yang lalu', type: 'info' },
        { id: 'NTF-005', message: 'Laporan laba rugi Juli 2026 siap diunduh', time: '2 jam yang lalu', type: 'info' }
    ],

    // Fungsi Helper
    getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    },

    formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number);
    }
};

// Tersedia secara global
window.DummyData = DummyData;
