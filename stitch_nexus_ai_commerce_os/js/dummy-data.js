// Dummy Data for AI Commerce OS
const DummyData = {
    // Orders data
    orders: [
        { id: 'ORD-001', customer: 'Budi Santoso', product: 'Sony WH-1000XM5', amount: 4500000, status: 'Selesai', platform: 'Tokopedia' },
        { id: 'ORD-002', customer: 'Siti Aminah', product: 'Samsung Galaxy S24', amount: 12000000, status: 'Diproses', platform: 'Shopee' },
        { id: 'ORD-003', customer: 'Ahmad Rizky', product: 'MacBook Air M3', amount: 18000000, status: 'Pending', platform: 'Lazada' },
        { id: 'ORD-004', customer: 'Dewi Kartika', product: 'iPad Pro 12.9"', amount: 15000000, status: 'Selesai', platform: 'Tokopedia' },
        { id: 'ORD-005', customer: 'Eko Prasetyo', product: 'iPhone 15 Pro Max', amount: 22000000, status: 'Diproses', platform: 'Shopee' }
    ],

    // Products data
    products: [
        { id: 'PRD-001', name: 'Sony WH-1000XM5', category: 'Audio', price: 4500000, stock: 150, sold: 89 },
        { id: 'PRD-002', name: 'Samsung Galaxy S24', category: 'Smartphone', price: 12000000, stock: 75, sold: 234 },
        { id: 'PRD-003', name: 'MacBook Air M3', category: 'Laptop', price: 18000000, stock: 30, sold: 45 },
        { id: 'PRD-004', name: 'iPad Pro 12.9"', category: 'Tablet', price: 15000000, stock: 50, sold: 67 },
        { id: 'PRD-005', name: 'iPhone 15 Pro Max', category: 'Smartphone', price: 22000000, stock: 25, sold: 156 }
    ],

    // Customers data
    customers: [
        { id: 'CUST-001', name: 'Budi Santoso', email: 'budi@email.com', phone: '+62 812-3456-7890', totalSpent: 4500000, orders: 5 },
        { id: 'CUST-002', name: 'Siti Aminah', email: 'siti@email.com', phone: '+62 813-4567-8901', totalSpent: 12000000, orders: 12 },
        { id: 'CUST-003', name: 'Ahmad Rizky', email: 'ahmad@email.com', phone: '+62 814-5678-9012', totalSpent: 18000000, orders: 8 },
        { id: 'CUST-004', name: 'Dewi Kartika', email: 'dewi@email.com', phone: '+62 815-6789-0123', totalSpent: 15000000, orders: 15 },
        { id: 'CUST-005', name: 'Eko Prasetyo', email: 'eko@email.com', phone: '+62 816-7890-1234', totalSpent: 22000000, orders: 20 }
    ],

    // Analytics data
    analytics: {
        totalRevenue: 71500000,
        totalOrders: 60,
        totalCustomers: 45,
        conversionRate: 3.5,
        averageOrderValue: 1191667,
        topProducts: ['iPhone 15 Pro Max', 'Samsung Galaxy S24', 'MacBook Air M3'],
        topPlatforms: ['Shopee', 'Tokopedia', 'Lazada']
    },

    // Marketplace data with real API information
    marketplaces: [
        { 
            id: 'MKT-001',
            name: 'Shopee', 
            portal: 'open.shopee.com',
            accountType: 'Third-Party Partner / ERP Developer',
            status: 'Connected', 
            lastSync: '2 menit yang lalu', 
            orders: 25, 
            revenue: 35000000,
            apiKey: 'shp_live_1234567890abcdef',
            shopId: 'SHOP-12345678',
            region: 'ID'
        },
        { 
            id: 'MKT-002',
            name: 'Tokopedia', 
            portal: 'developer.tokopedia.com',
            accountType: 'Official Partner / Open API Seller',
            status: 'Connected', 
            lastSync: '5 menit yang lalu', 
            orders: 20, 
            revenue: 25000000,
            apiKey: 'tokopedia_live_9876543210fedcba',
            shopId: 'SHOP-87654321',
            region: 'ID'
        },
        { 
            id: 'MKT-003',
            name: 'Lazada', 
            portal: 'open.lazada.com',
            accountType: 'API Partner',
            status: 'Connected', 
            lastSync: '10 menit yang lalu', 
            orders: 10, 
            revenue: 8000000,
            apiKey: 'lazada_live_abcdef1234567890',
            shopId: 'SHOP-11223344',
            region: 'ID'
        },
        { 
            id: 'MKT-004',
            name: 'TikTok Shop', 
            portal: 'partner.tiktokshop.com',
            accountType: 'Service Partner / ISV Developer',
            status: 'Connected', 
            lastSync: '15 menit yang lalu', 
            orders: 5, 
            revenue: 3500000,
            apiKey: 'tiktok_live_5555555555555555',
            shopId: 'SHOP-55555555',
            region: 'ID'
        },
        { 
            id: 'MKT-005',
            name: 'Bukalapak', 
            portal: 'developer.bukalapak.com',
            accountType: 'API Partner',
            status: 'Pending', 
            lastSync: '-', 
            orders: 0, 
            revenue: 0,
            apiKey: '',
            shopId: '',
            region: 'ID'
        }
    ],

    // API Credentials management
    apiCredentials: [
        {
            id: 'API-001',
            marketplaceId: 'MKT-001',
            marketplace: 'Shopee',
            clientId: 'shp_client_1234567890',
            clientSecret: 'shp_secret_abcdef123456',
            accessToken: 'shp_access_token_9876543210fedcba',
            refreshToken: 'shp_refresh_token_abcdef9876543210',
            expiresAt: '2024-12-31T23:59:59Z',
            scopes: ['orders.read', 'orders.write', 'products.read', 'products.write'],
            status: 'Active'
        },
        {
            id: 'API-002',
            marketplaceId: 'MKT-002',
            marketplace: 'Tokopedia',
            clientId: 'tokopedia_client_9876543210',
            clientSecret: 'tokopedia_secret_fedcba0987654321',
            accessToken: 'tokopedia_access_token_1234567890abcdef',
            refreshToken: 'tokopedia_refresh_token_0987654321fedcba',
            expiresAt: '2024-12-31T23:59:59Z',
            scopes: ['order.read', 'order.write', 'product.read', 'product.write'],
            status: 'Active'
        },
        {
            id: 'API-003',
            marketplaceId: 'MKT-003',
            marketplace: 'Lazada',
            clientId: 'lazada_client_abcdef123456',
            clientSecret: 'lazada_secret_0987654321fedcba',
            accessToken: 'lazada_access_token_5555555555555555',
            refreshToken: 'lazada_refresh_token_6666666666666666',
            expiresAt: '2024-12-31T23:59:59Z',
            scopes: ['order.read', 'order.write', 'product.read', 'product.write'],
            status: 'Active'
        },
        {
            id: 'API-004',
            marketplaceId: 'MKT-004',
            marketplace: 'TikTok Shop',
            clientId: 'tiktok_client_7777777777',
            clientSecret: 'tiktok_secret_8888888888',
            accessToken: 'tiktok_access_token_9999999999999999',
            refreshToken: 'tiktok_refresh_token_0000000000000000',
            expiresAt: '2024-12-31T23:59:59Z',
            scopes: ['order.read', 'order.write', 'product.read', 'product.write'],
            status: 'Active'
        }
    ],

    // API Rate Limits
    apiRateLimits: [
        { marketplace: 'Shopee', endpoint: '/orders', limit: 1000, remaining: 850, resetTime: '2024-01-01T00:00:00Z' },
        { marketplace: 'Tokopedia', endpoint: '/orders', limit: 500, remaining: 420, resetTime: '2024-01-01T00:00:00Z' },
        { marketplace: 'Lazada', endpoint: '/orders', limit: 2000, remaining: 1800, resetTime: '2024-01-01T00:00:00Z' },
        { marketplace: 'TikTok Shop', endpoint: '/orders', limit: 300, remaining: 250, resetTime: '2024-01-01T00:00:00Z' }
    ],

    // Affiliate data
    affiliates: [
        { id: 'AFF-001', name: 'Partner A', clicks: 1250, conversions: 45, commission: 4500000, status: 'Active' },
        { id: 'AFF-002', name: 'Partner B', clicks: 890, conversions: 32, commission: 3200000, status: 'Active' },
        { id: 'AFF-003', name: 'Partner C', clicks: 560, conversions: 18, commission: 1800000, status: 'Active' },
        { id: 'AFF-004', name: 'Partner D', clicks: 340, conversions: 12, commission: 1200000, status: 'Inactive' },
        { id: 'AFF-005', name: 'Partner E', clicks: 210, conversions: 8, commission: 800000, status: 'Active' }
    ],

    // Content data
    content: [
        { id: 'CNT-001', title: 'Review Sony WH-1000XM5', type: 'Video', status: 'Published', views: 12500, platform: 'YouTube' },
        { id: 'CNT-002', title: 'Unboxing Samsung Galaxy S24', type: 'Video', status: 'Published', views: 8900, platform: 'YouTube' },
        { id: 'CNT-003', title: 'Tips Memilih Laptop', type: 'Article', status: 'Draft', views: 0, platform: 'Blog' },
        { id: 'CNT-004', title: 'Komparasi iPhone vs Android', type: 'Video', status: 'Published', views: 15600, platform: 'YouTube' },
        { id: 'CNT-005', title: 'Tutorial iPad Pro', type: 'Video', status: 'Processing', views: 0, platform: 'TikTok' }
    ],

    // Financial data
    financial: {
        revenue: 71500000,
        expenses: 45000000,
        profit: 26500000,
        margin: 37.1,
        monthlyRevenue: [45000000, 52000000, 48000000, 61000000, 55000000, 71500000],
        monthlyExpenses: [38000000, 40000000, 39000000, 42000000, 41000000, 45000000]
    },

    // AI suggestions
    aiSuggestions: [
        'Tingkatkan stok untuk iPhone 15 Pro Max - permintaan meningkat 25%',
        'Optimalkan harga MacBook Air M3 untuk kompetitif di Shopee',
        'Buat konten video untuk Sony WH-1000XM5 - potensi viral tinggi',
        'Aktifkan promosi flash sale untuk Samsung Galaxy S24',
        'Perluas ke TikTok Shop - potensi penjualan 30% lebih tinggi'
    ],

    // Notifications
    notifications: [
        { id: 'NOT-001', message: 'Pesanan baru #ORD-006 dari Shopee', time: '2 menit yang lalu', type: 'order' },
        { id: 'NOT-002', message: 'Stok Sony WH-1000XM5 hampir habis', time: '15 menit yang lalu', type: 'warning' },
        { id: 'NOT-003', message: 'Affiliate Partner A mencapai target bulanan', time: '1 jam yang lalu', type: 'success' },
        { id: 'NOT-004', message: 'Sync marketplace berhasil', time: '2 jam yang lalu', type: 'info' },
        { id: 'NOT-005', message: 'Laporan keuangan bulanan siap', time: '3 jam yang lalu', type: 'info' }
    ],

    // Get random data helper
    getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Get formatted currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    },

    // Get formatted number
    formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number);
    }
};

// Make available globally
window.DummyData = DummyData;
