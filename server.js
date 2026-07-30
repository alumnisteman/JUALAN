/**
 * AI Commerce OS - Standalone Server
 * Menyajikan frontend statis + semua API endpoint dengan data realistis
 * Bekerja tanpa Docker, PostgreSQL, Redis, atau Meilisearch
 */
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── CORS headers ────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Static Files ────────────────────────────────────────────────
const STATIC_DIR = path.join(__dirname, 'stitch_nexus_ai_commerce_os');
app.use(express.static(STATIC_DIR));

// ══════════════════════════════════════════════════════════════════
// IN-MEMORY DATA STORE
// ══════════════════════════════════════════════════════════════════

// Data produk marketplace
const PRODUCTS = [
  { id: 1, marketplace: 'shopee', name: 'iPhone 16 Pro Max 256GB Titanium Black', category: 'Smartphone', price: 21499000, original_price: 23999000, discount_pct: 10, sold_count: 2847, rating: 4.9, review_count: 1243, stock: 35, shop_name: 'iStore Official', shop_location: 'Jakarta Pusat', is_mall: true, image_url: 'https://picsum.photos/seed/iphone16/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 2, marketplace: 'tokopedia', name: 'Samsung Galaxy S25 Ultra 512GB Titanium Gray', category: 'Smartphone', price: 19999000, original_price: 22499000, discount_pct: 11, sold_count: 1956, rating: 4.8, review_count: 876, stock: 42, shop_name: 'Samsung Official Store', shop_location: 'Jakarta Selatan', is_mall: true, image_url: 'https://picsum.photos/seed/samsungs25/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 3, marketplace: 'tiktok', name: 'MacBook Air M4 15" 16GB 512GB Space Gray', category: 'Laptop', price: 22499000, original_price: 24999000, discount_pct: 10, sold_count: 643, rating: 4.9, review_count: 312, stock: 18, shop_name: 'Apple Premium Reseller', shop_location: 'Surabaya', is_mall: true, image_url: 'https://picsum.photos/seed/macbookm4/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 4, marketplace: 'lazada', name: 'iPad Air M3 11" 128GB WiFi Blue', category: 'Tablet', price: 10999000, original_price: 12499000, discount_pct: 12, sold_count: 934, rating: 4.8, review_count: 445, stock: 28, shop_name: 'LazMall Apple', shop_location: 'Bandung', is_mall: true, image_url: 'https://picsum.photos/seed/ipadm3/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 5, marketplace: 'shopee', name: 'Sony WH-1000XM6 Wireless Headphone Black', category: 'Audio', price: 5299000, original_price: 5999000, discount_pct: 12, sold_count: 3124, rating: 4.9, review_count: 1876, stock: 67, shop_name: 'Sony Center Indonesia', shop_location: 'Jakarta Barat', is_mall: true, image_url: 'https://picsum.photos/seed/sonywh6/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 6, marketplace: 'tokopedia', name: 'ASUS ROG Zephyrus G14 2026 RTX 4070', category: 'Laptop', price: 24999000, original_price: 27999000, discount_pct: 11, sold_count: 387, rating: 4.7, review_count: 189, stock: 12, shop_name: 'ASUS Store Official', shop_location: 'Jakarta Selatan', is_mall: true, image_url: 'https://picsum.photos/seed/asusrog/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 7, marketplace: 'tiktok', name: 'Xiaomi 15 Ultra 512GB White', category: 'Smartphone', price: 12999000, original_price: 14999000, discount_pct: 13, sold_count: 1782, rating: 4.7, review_count: 934, stock: 54, shop_name: 'Xiaomi Official', shop_location: 'Bekasi', is_mall: true, image_url: 'https://picsum.photos/seed/xiaomi15u/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 8, marketplace: 'lazada', name: 'Samsung Galaxy Tab S10 Ultra 256GB', category: 'Tablet', price: 17499000, original_price: 19999000, discount_pct: 13, sold_count: 478, rating: 4.8, review_count: 234, stock: 21, shop_name: 'Samsung LazMall', shop_location: 'Jakarta Utara', is_mall: true, image_url: 'https://picsum.photos/seed/tabs10/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 9, marketplace: 'shopee', name: 'Apple Watch Ultra 3 49mm Titanium', category: 'Wearable', price: 14999000, original_price: 16999000, discount_pct: 12, sold_count: 823, rating: 4.9, review_count: 467, stock: 30, shop_name: 'iStore Official', shop_location: 'Jakarta Pusat', is_mall: true, image_url: 'https://picsum.photos/seed/awultra3/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 10, marketplace: 'tokopedia', name: 'AirPods Pro 3 USB-C', category: 'Audio', price: 4299000, original_price: 4999000, discount_pct: 14, sold_count: 4312, rating: 4.9, review_count: 2341, stock: 95, shop_name: 'Apple Authorized Reseller', shop_location: 'Surabaya', is_mall: true, image_url: 'https://picsum.photos/seed/airpodspro3/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 11, marketplace: 'blibli', name: 'Baju Gamis Premium Motif Batik Modern', category: 'Fashion', price: 189000, original_price: 299000, discount_pct: 37, sold_count: 5431, rating: 4.6, review_count: 2876, stock: 200, shop_name: 'BatikNusantara', shop_location: 'Yogyakarta', is_mall: false, image_url: 'https://picsum.photos/seed/batikg/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 12, marketplace: 'zalora', name: 'Sepatu Running Nike Air Max 2026', category: 'Sepatu', price: 1499000, original_price: 1999000, discount_pct: 25, sold_count: 2134, rating: 4.7, review_count: 1123, stock: 78, shop_name: 'Nike Official', shop_location: 'Jakarta Selatan', is_mall: true, image_url: 'https://picsum.photos/seed/nikeam/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 13, marketplace: 'shopee', name: 'Skincare SOMETHINC Niacinamide 10% Serum', category: 'Kecantikan', price: 89000, original_price: 129000, discount_pct: 31, sold_count: 8923, rating: 4.8, review_count: 4567, stock: 500, shop_name: 'SOMETHINC Official', shop_location: 'Jakarta Selatan', is_mall: true, image_url: 'https://picsum.photos/seed/skincare1/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 14, marketplace: 'tokopedia', name: 'Blender Portable USB Rechargeable 600ml', category: 'Peralatan Rumah', price: 89000, original_price: 149000, discount_pct: 40, sold_count: 12450, rating: 4.5, review_count: 5678, stock: 320, shop_name: 'KitchenPlus', shop_location: 'Tangerang', is_mall: false, image_url: 'https://picsum.photos/seed/blender/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 15, marketplace: 'tiktok', name: 'Parfum HMNS Orgasm EDP 60ml', category: 'Kecantikan', price: 320000, original_price: 380000, discount_pct: 16, sold_count: 6743, rating: 4.8, review_count: 3234, stock: 156, shop_name: 'HMNS Official', shop_location: 'Jakarta Pusat', is_mall: true, image_url: 'https://picsum.photos/seed/hmns/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 16, marketplace: 'lazada', name: 'Meja Kerja Minimalis L-Shape 120x60cm', category: 'Furnitur', price: 1299000, original_price: 1799000, discount_pct: 28, sold_count: 1234, rating: 4.6, review_count: 678, stock: 45, shop_name: 'FurniturKita', shop_location: 'Bogor', is_mall: false, image_url: 'https://picsum.photos/seed/mejak/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 17, marketplace: 'blibli', name: 'Kopi Kenangan Ready to Drink 250ml 6 pcs', category: 'Makanan & Minuman', price: 89000, original_price: 120000, discount_pct: 26, sold_count: 15234, rating: 4.7, review_count: 7890, stock: 1000, shop_name: 'Kopi Kenangan Official', shop_location: 'Jakarta', is_mall: true, image_url: 'https://picsum.photos/seed/kopik/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 18, marketplace: 'zalora', name: 'Tas Ransel Laptop Canvas 15.6" Premium', category: 'Tas', price: 349000, original_price: 499000, discount_pct: 30, sold_count: 3456, rating: 4.7, review_count: 1890, stock: 89, shop_name: 'BagMaster', shop_location: 'Bandung', is_mall: false, image_url: 'https://picsum.photos/seed/tasransel/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 19, marketplace: 'shopee', name: 'Headphone Bluetooth JBL Tune 760NC', category: 'Audio', price: 899000, original_price: 1299000, discount_pct: 31, sold_count: 4521, rating: 4.7, review_count: 2345, stock: 134, shop_name: 'JBL Official Store', shop_location: 'Jakarta', is_mall: true, image_url: 'https://picsum.photos/seed/jbl760/200/200', product_url: '#', scraped_at: new Date().toISOString() },
  { id: 20, marketplace: 'tokopedia', name: 'Rak Buku Kayu Jati 5 Susun Natural', category: 'Furnitur', price: 850000, original_price: 1100000, discount_pct: 23, sold_count: 876, rating: 4.8, review_count: 456, stock: 34, shop_name: 'WoodCraft Jogja', shop_location: 'Yogyakarta', is_mall: false, image_url: 'https://picsum.photos/seed/rakbuku/200/200', product_url: '#', scraped_at: new Date().toISOString() },
];

// Data orders / transaksi
const ORDERS = [
  { id: 1, customer_name: 'Budi Santoso', product_name: 'Langganan Paket Enterprise AI Suite', amount: 2499000, status: 'COMPLETED', platform: 'Subscription', created_at: new Date(Date.now() - 2*3600000).toISOString() },
  { id: 2, customer_name: 'Siti Aminah', product_name: 'Komisi Penjualan Skincare Viral (Shopee Affiliate)', amount: 142100, status: 'COMPLETED', platform: 'Affiliate', created_at: new Date(Date.now() - 3*3600000).toISOString() },
  { id: 3, customer_name: 'Joko Prasetyo', product_name: 'Selisih Margin Penjualan Laptop ASUS ROG', amount: 819200, status: 'COMPLETED', platform: 'Margin', created_at: new Date(Date.now() - 4*3600000).toISOString() },
  { id: 4, customer_name: 'Rini Handayani', product_name: 'Pembelian Tokopedia: Kopi Kenangan 1L', amount: 89000, status: 'COMPLETED', platform: 'Marketplace', created_at: new Date(Date.now() - 5*3600000).toISOString() },
  { id: 5, customer_name: 'Ahmad Fauzi', product_name: 'Langganan Paket Pro Member Weekly', amount: 152200, status: 'COMPLETED', platform: 'Subscription', created_at: new Date(Date.now() - 6*3600000).toISOString() },
  { id: 6, customer_name: 'Dewi Lestari', product_name: 'Komisi Penjualan Baju Gamis OOTD (TikTok Affiliate)', amount: 56000, status: 'COMPLETED', platform: 'Affiliate', created_at: new Date(Date.now() - 7*3600000).toISOString() },
  { id: 7, customer_name: 'Andi Wijaya', product_name: 'Selisih Margin Penjualan Meja Kerja Minimalis', amount: 210000, status: 'COMPLETED', platform: 'Margin', created_at: new Date(Date.now() - 8*3600000).toISOString() },
  { id: 8, customer_name: 'Lina Marlina', product_name: 'Pembelian Shopee: Headphone Bluetooth JBL', amount: 450000, status: 'COMPLETED', platform: 'Marketplace', created_at: new Date(Date.now() - 9*3600000).toISOString() },
  { id: 9, customer_name: 'Eko Yulianto', product_name: 'Langganan Add-on: WhatsApp API Gateway', amount: 99000, status: 'COMPLETED', platform: 'Subscription', created_at: new Date(Date.now() - 10*3600000).toISOString() },
  { id: 10, customer_name: 'Sri Wahyuni', product_name: 'Komisi Penjualan Blender Portable (Lazada Affiliate)', amount: 28500, status: 'COMPLETED', platform: 'Affiliate', created_at: new Date(Date.now() - 12*3600000).toISOString() },
  { id: 11, customer_name: 'Hadi Syahputra', product_name: 'Pembelian TikTok Shop: Parfum HMNS Orgasm', amount: 320000, status: 'COMPLETED', platform: 'Marketplace', created_at: new Date(Date.now() - 14*3600000).toISOString() },
  { id: 12, customer_name: 'Indah Permata', product_name: 'Selisih Margin Penjualan Rak Buku Kayu', amount: 180000, status: 'COMPLETED', platform: 'Margin', created_at: new Date(Date.now() - 16*3600000).toISOString() },
];

// Data scrape logs
const SCRAPE_LOGS = [
  { id: 1, marketplace: 'shopee', category: 'Flash Sale', items_scraped: 50, items_saved: 48, status: 'SUCCESS', started_at: new Date(Date.now() - 15*60000).toISOString(), finished_at: new Date(Date.now() - 14*60000).toISOString() },
  { id: 2, marketplace: 'tokopedia', category: 'elektronik', items_scraped: 30, items_saved: 30, status: 'SUCCESS', started_at: new Date(Date.now() - 12*60000).toISOString(), finished_at: new Date(Date.now() - 11*60000).toISOString() },
  { id: 3, marketplace: 'lazada', category: 'handphone', items_scraped: 25, items_saved: 20, status: 'SUCCESS', started_at: new Date(Date.now() - 10*60000).toISOString(), finished_at: new Date(Date.now() - 9*60000).toISOString() },
  { id: 4, marketplace: 'tiktok', category: 'skincare', items_scraped: 40, items_saved: 40, status: 'SUCCESS', started_at: new Date(Date.now() - 8*60000).toISOString(), finished_at: new Date(Date.now() - 7*60000).toISOString() },
  { id: 5, marketplace: 'zalora', category: 'sepatu pria', items_scraped: 15, items_saved: 12, status: 'SUCCESS', started_at: new Date(Date.now() - 5*60000).toISOString(), finished_at: new Date(Date.now() - 4*60000).toISOString() },
  { id: 6, marketplace: 'blibli', category: 'fashion', items_scraped: 35, items_saved: 35, status: 'SUCCESS', started_at: new Date(Date.now() - 3*60000).toISOString(), finished_at: new Date(Date.now() - 2*60000).toISOString() },
];

// Data API keys (in-memory CRUD)
let API_KEYS = [
  { id: 1, platform: 'Tokopedia Prod', api_key: 'tk_live_f39281a82da39A2', permissions: ['PRODUK', 'PESANAN', 'CHAT'], quota: '850 / 1000 daily', created_at: new Date().toISOString() },
  { id: 2, platform: 'Shopee Main', api_key: 'shp_key_10df8a287bfF412', permissions: ['PRODUK', 'PESANAN'], quota: '1.2k / 5k daily', created_at: new Date().toISOString() },
  { id: 3, platform: 'Meta Graph', api_key: 'EAAG_token_90f230da10Z9', permissions: ['ADS_MNG', 'CATALOG'], quota: 'No Limit', created_at: new Date().toISOString() },
  { id: 4, platform: 'TikTok Shop', api_key: 'awttslvj9382dr8j', permissions: ['PRODUK', 'PESANAN'], quota: '250 / 300 daily', created_at: new Date().toISOString() },
];
let apiKeyIdCounter = 5;

// Social posts (in-memory CRUD)
let SOCIAL_POSTS = [
  { id: 1, caption: 'iPhone 16 Pro Max hadir dengan chip A18 Pro! Performa yang mengagumkan untuk fotografi & gaming. 📱✨ #iPhone16ProMax #Apple #Gadget #TechID', platforms: ['Instagram', 'TikTok'], scheduled_at: new Date(Date.now() + 2*3600000).toISOString(), status: 'PENDING', created_at: new Date().toISOString() },
  { id: 2, caption: 'Flash Sale Samsung S25 Ultra! Diskon 11% hari ini aja. Stok terbatas, jangan sampai ketinggalan! 🔥', platforms: ['Facebook', 'Instagram'], scheduled_at: new Date(Date.now() + 4*3600000).toISOString(), status: 'PENDING', created_at: new Date().toISOString() },
  { id: 3, caption: 'Sony WH-1000XM6 - Noise Cancelling terbaik 2026! Dengerin musik tanpa gangguan. Review jujur di bio! 🎧', platforms: ['YouTube', 'TikTok'], scheduled_at: new Date(Date.now() - 1*3600000).toISOString(), status: 'POSTED', created_at: new Date().toISOString() },
];
let socialPostIdCounter = 4;

// Generated content (in-memory)
const generatedContent = new Map();

// ══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════

function getMarketplaceStats() {
  const marketplaces = ['shopee', 'tokopedia', 'tiktok', 'lazada', 'blibli', 'zalora'];
  return marketplaces.map(mp => {
    const mpProducts = PRODUCTS.filter(p => p.marketplace === mp);
    if (mpProducts.length === 0) return null;
    return {
      marketplace: mp,
      total_products: mpProducts.length,
      avg_price: mpProducts.reduce((s, p) => s + p.price, 0) / mpProducts.length,
      total_sold: mpProducts.reduce((s, p) => s + p.sold_count, 0),
      avg_rating: mpProducts.reduce((s, p) => s + p.rating, 0) / mpProducts.length,
      last_scraped: new Date().toISOString()
    };
  }).filter(Boolean);
}

// ══════════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════════

// ─── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'in-memory (mock mode)',
    meilisearch: 'available',
    redis: 'in-memory',
    timestamp: new Date().toISOString(),
    mode: 'standalone',
    products: PRODUCTS.length,
    orders: ORDERS.length
  });
});

// ─── Dashboard Overview ───────────────────────────────────────────
app.get('/api/dashboard/overview', (req, res) => {
  const stats = getMarketplaceStats();
  const totalProducts = PRODUCTS.length;
  const totalMarketplaces = new Set(PRODUCTS.map(p => p.marketplace)).size;
  const totalSold = PRODUCTS.reduce((s, p) => s + p.sold_count, 0);
  const avgPrice = PRODUCTS.reduce((s, p) => s + p.price, 0) / PRODUCTS.length;
  const avgRating = PRODUCTS.reduce((s, p) => s + p.rating, 0) / PRODUCTS.length;
  const estimatedGmv = PRODUCTS.reduce((s, p) => s + p.price * p.sold_count, 0);

  // Category breakdown
  const catMap = {};
  PRODUCTS.forEach(p => {
    catMap[p.category] = (catMap[p.category] || 0) + 1;
  });
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  res.json({
    total_products: totalProducts,
    total_marketplaces: totalMarketplaces,
    total_sold: totalSold,
    avg_price: Math.round(avgPrice),
    avg_rating: parseFloat(avgRating.toFixed(2)),
    estimated_gmv: estimatedGmv,
    last_scraped: new Date().toISOString(),
    today_new_products: 127,
    marketplaces: stats,
    top_categories: topCategories
  });
});

// ─── Marketplace Products ─────────────────────────────────────────
app.get('/api/marketplace/products', (req, res) => {
  let { marketplace, category, sort = 'sold_count', order = 'DESC', limit = 50, offset = 0 } = req.query;
  limit = parseInt(limit) || 50;
  offset = parseInt(offset) || 0;

  let filtered = [...PRODUCTS];
  if (marketplace) filtered = filtered.filter(p => p.marketplace === marketplace.toLowerCase());
  if (category) filtered = filtered.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));

  const sortFns = {
    sold_count: (a, b) => b.sold_count - a.sold_count,
    rating: (a, b) => b.rating - a.rating,
    price: (a, b) => order.toUpperCase() === 'ASC' ? a.price - b.price : b.price - a.price,
    scraped_at: (a, b) => new Date(b.scraped_at) - new Date(a.scraped_at),
    discount_pct: (a, b) => b.discount_pct - a.discount_pct,
  };
  if (sortFns[sort]) filtered.sort(sortFns[sort]);
  if (sort === 'sold_count' && order.toUpperCase() === 'ASC') filtered.reverse();

  res.json({
    total: filtered.length,
    limit,
    offset,
    data: filtered.slice(offset, offset + limit)
  });
});

// ─── Marketplace Stats ────────────────────────────────────────────
app.get('/api/marketplace/stats', (req, res) => {
  res.json(getMarketplaceStats());
});

// ─── Trending Products ────────────────────────────────────────────
app.get('/api/marketplace/trending', (req, res) => {
  const { limit = 20 } = req.query;
  const trending = [...PRODUCTS]
    .map(p => ({ ...p, trend_score: p.sold_count * p.rating + p.review_count * 0.5 }))
    .sort((a, b) => b.trend_score - a.trend_score)
    .slice(0, parseInt(limit));
  res.json(trending);
});

// ─── Flash Sale ───────────────────────────────────────────────────
app.get('/api/marketplace/flash-sale', (req, res) => {
  const flashSale = [...PRODUCTS]
    .filter(p => p.discount_pct >= 20)
    .sort((a, b) => b.discount_pct - a.discount_pct);
  res.json(flashSale);
});

// ─── Categories ───────────────────────────────────────────────────
app.get('/api/marketplace/categories', (req, res) => {
  const catMap = {};
  PRODUCTS.forEach(p => {
    catMap[p.category] = (catMap[p.category] || 0) + 1;
  });
  const categories = Object.entries(catMap)
    .map(([category, product_count]) => ({ category, product_count }))
    .sort((a, b) => b.product_count - a.product_count);
  res.json(categories);
});

// ─── Price Compare ────────────────────────────────────────────────
app.get('/api/marketplace/price-compare', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Parameter q diperlukan' });
  const results = PRODUCTS
    .filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.price - b.price);
  res.json(results);
});

// ─── Top Sellers ──────────────────────────────────────────────────
app.get('/api/marketplace/top-sellers', (req, res) => {
  const shopMap = {};
  PRODUCTS.forEach(p => {
    const key = `${p.marketplace}__${p.shop_name}`;
    if (!shopMap[key]) {
      shopMap[key] = {
        marketplace: p.marketplace,
        shop_name: p.shop_name,
        shop_location: p.shop_location,
        product_count: 0,
        total_sold: 0,
        total_rating: 0,
        total_price: 0
      };
    }
    shopMap[key].product_count++;
    shopMap[key].total_sold += p.sold_count;
    shopMap[key].total_rating += p.rating;
    shopMap[key].total_price += p.price;
  });

  const sellers = Object.values(shopMap).map(s => ({
    ...s,
    avg_rating: parseFloat((s.total_rating / s.product_count).toFixed(2)),
    avg_price: Math.round(s.total_price / s.product_count)
  })).sort((a, b) => b.total_sold - a.total_sold).slice(0, 50);

  res.json(sellers);
});

// ─── Market Intelligence - Category Trends ───────────────────────
app.get('/api/intelligence/category-trends', (req, res) => {
  const catMap = {};
  PRODUCTS.forEach(p => {
    if (!catMap[p.category]) catMap[p.category] = { category: p.category, product_count: 0, total_sold: 0, total_rating: 0 };
    catMap[p.category].product_count++;
    catMap[p.category].total_sold += p.sold_count;
    catMap[p.category].total_rating += p.rating;
  });

  let trends = Object.values(catMap)
    .map(c => ({
      ...c,
      avg_rating: parseFloat((c.total_rating / c.product_count).toFixed(2)),
      trend_score: (c.total_sold * c.total_rating / c.product_count) / 100
    }))
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 3);

  const maxScore = Math.max(...trends.map(t => t.trend_score), 100);
  trends = trends.map(t => ({
    ...t,
    normalized_score: Math.min(100, Math.max(10, Math.round((t.trend_score / maxScore) * 100)))
  }));

  res.json(trends);
});

// ─── Market Intelligence - Top Competitors ────────────────────────
app.get('/api/intelligence/top-competitors', (req, res) => {
  const shopMap = {};
  PRODUCTS.forEach(p => {
    const key = `${p.marketplace}__${p.shop_name}`;
    if (!shopMap[key]) shopMap[key] = { marketplace: p.marketplace, shop_name: p.shop_name, shop_location: p.shop_location, product_count: 0, total_sold: 0, avg_rating: 0, avg_price: 0, total_rating: 0, total_price: 0 };
    shopMap[key].product_count++;
    shopMap[key].total_sold += p.sold_count;
    shopMap[key].total_rating += p.rating;
    shopMap[key].total_price += p.price;
  });

  const competitors = Object.values(shopMap)
    .map(s => ({ ...s, avg_rating: parseFloat((s.total_rating / s.product_count).toFixed(2)), avg_price: Math.round(s.total_price / s.product_count) }))
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 5);

  res.json(competitors);
});

// ─── Market Intelligence - Alerts ────────────────────────────────
app.get('/api/intelligence/alerts', (req, res) => {
  const alerts = [];

  // Price drops
  const drops = [...PRODUCTS].filter(p => p.discount_pct >= 25).sort((a, b) => b.discount_pct - a.discount_pct).slice(0, 3);
  drops.forEach(d => {
    alerts.push({
      type: 'PRICE_DROP_DETECTED',
      severity: 'risk-danger',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      title: `Competitor "${d.shop_name}" turunkan harga ${d.discount_pct}%`,
      desc: `Target SKU: ${d.name.substring(0, 40)}... di ${d.marketplace}. Tindakan counter-measure disarankan.`
    });
  });

  // High demand
  const trending = [...PRODUCTS].filter(p => p.sold_count > 1000).sort((a, b) => b.sold_count - a.sold_count).slice(0, 2);
  trending.forEach(t => {
    alerts.push({
      type: 'HIGH_DEMAND',
      severity: 'primary-container',
      time: new Date(Date.now() - 30 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      title: `Demand Spike di ${t.category.toUpperCase()}`,
      desc: `"${t.name.substring(0, 35)}..." memiliki velocity tinggi di ${t.marketplace}.`
    });
  });

  res.json(alerts);
});

// ─── Scrape Trigger ───────────────────────────────────────────────
app.post('/api/marketplace/scrape', (req, res) => {
  // Log the scrape event
  SCRAPE_LOGS.unshift({
    id: SCRAPE_LOGS.length + 1,
    marketplace: 'all',
    category: 'manual_trigger',
    items_scraped: PRODUCTS.length,
    items_saved: PRODUCTS.length,
    status: 'SUCCESS',
    started_at: new Date().toISOString(),
    finished_at: new Date(Date.now() + 60000).toISOString()
  });
  res.json({ message: 'Scraping selesai (mode standalone: data dummy dimuat ulang)', status: 'completed', products: PRODUCTS.length });
});

// ─── Search ───────────────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const { q, limit = 20, marketplace, category } = req.query;
  if (!q) return res.status(400).json({ error: 'Parameter q diperlukan' });

  let results = PRODUCTS.filter(p => {
    const searchText = `${p.name} ${p.shop_name} ${p.category} ${p.marketplace}`.toLowerCase();
    return searchText.includes(q.toLowerCase());
  });

  if (marketplace) results = results.filter(p => p.marketplace === marketplace.toLowerCase());
  if (category) results = results.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));

  res.json({
    hits: results.slice(0, parseInt(limit)),
    query: q,
    estimatedTotalHits: results.length,
    processingTimeMs: 2
  });
});

// ─── Content Projects ─────────────────────────────────────────────
app.get('/api/content/projects', (req, res) => {
  const topProducts = [...PRODUCTS]
    .sort((a, b) => b.sold_count - a.sold_count)
    .slice(0, 10);

  const projects = topProducts.map((p, i) => ({
    id: `PRJ-${String(i + 1).padStart(3, '0')}`,
    product_name: p.name,
    marketplace: p.marketplace,
    category: p.category,
    price: p.price,
    sold_count: p.sold_count,
    image_url: p.image_url,
    product_url: p.product_url,
    content_type: i % 3 === 0 ? 'SEO Description' : (i % 3 === 1 ? 'Social Media' : 'Marketing Copy'),
    status: i < 3 ? 'completed' : (i < 6 ? 'in_progress' : 'queued'),
    progress: i < 3 ? 100 : (i < 6 ? 40 + (i * 15) : 0)
  }));

  // Add generated content projects
  const genProjects = Array.from(generatedContent.values()).map((c, i) => ({
    id: c.id,
    product_name: c.prompt.substring(0, 60),
    marketplace: 'manual',
    category: 'Custom',
    content_type: c.type,
    status: 'completed',
    progress: 100
  }));

  const allProjects = [...genProjects, ...projects];

  res.json({
    projects: allProjects,
    stats: {
      total_products: PRODUCTS.length,
      total_categories: new Set(PRODUCTS.map(p => p.category)).size,
      total_marketplaces: new Set(PRODUCTS.map(p => p.marketplace)).size,
      active_projects: projects.filter(p => p.status === 'in_progress').length,
      completed_projects: projects.filter(p => p.status === 'completed').length + genProjects.length,
      queued_projects: projects.filter(p => p.status === 'queued').length
    }
  });
});

// ─── Content Generate (AI) ────────────────────────────────────────
const FALLBACK_CONTENT = {
  Deskripsi: (prompt) => `✨ ${prompt.toUpperCase()} ✨

Hadirkan pengalaman belanja terbaik dengan produk berkualitas premium ini. Dibuat dengan standar tinggi untuk memenuhi kebutuhan Anda sehari-hari.

🔥 KEUNGGULAN PRODUK:
• Kualitas premium dengan bahan pilihan terbaik
• Desain modern yang elegan dan fungsional
• Garansi resmi 12 bulan dari toko kami
• Pengiriman cepat ke seluruh Indonesia
• After-sales service responsif 24/7

💎 Jangan lewatkan kesempatan emas ini! Stok terbatas, harga spesial hanya hari ini.
Hubungi kami sekarang dan dapatkan penawaran eksklusif! 🛒`,

  'Social Media': (prompt) => `📱 INSTAGRAM CAPTION:
Lagi nyari ${prompt}? Ini dia pilihan terbaik kamu! 🔥 Kualitas premium, harga bersahabat. Link di bio ya bestie! 💕
#${prompt.replace(/\s+/g, '')} #ShoppingID #RekomendaiHariIni #TokoBestie #BelanjaMurah

🎵 TIKTOK CAPTION:
POV: Nemu ${prompt} yang worth it banget 😭✨ Swipe untuk lihat detailnya! #viral #fyp #belanjatiktok #rekomendasiproduk

💬 FACEBOOK MARKETPLACE:
DIJUAL: ${prompt} | Kondisi baru | Harga kompetitif | Pengiriman ke seluruh Indonesia | Fast response | Klik "Kirim Pesan" untuk info lebih lanjut!`,

  Marketing: (prompt) => `🎯 HEADLINE IKLAN (3 Variasi):
1. "${prompt} Terbaik di Indonesia!"
2. "Dapatkan ${prompt} Harga Spesial!"
3. "${prompt} — Kualitas Premium, Harga Terjangkau"

📝 DESKRIPSI IKLAN:
Variasi 1: "Produk pilihan jutaan pembeli. Garansi resmi, pengiriman cepat!"
Variasi 2: "Diskon eksklusif hari ini. Stok terbatas, pesan sekarang!"

⭐ USP (Unique Selling Points):
• Kualitas terjamin dengan garansi resmi
• Harga terbaik dibanding kompetitor  
• Layanan pelanggan 24/7

👥 TARGET AUDIENCE: Usia 18-45 tahun, tertarik teknologi/lifestyle, pengguna aktif marketplace

🔍 KEYWORDS SEO: ${prompt}, beli ${prompt}, harga ${prompt}, ${prompt} murah, ${prompt} original, ${prompt} terpercaya, ${prompt} resmi`,

  Custom: (prompt) => `🤖 AI Commerce OS — Analisis Bisnis

Berdasarkan permintaan Anda: "${prompt}"

📊 REKOMENDASI STRATEGIS:

1. ANALISIS PASAR
   • Identifikasi segmen target yang tepat untuk produk Anda
   • Monitor kompetitor secara rutin menggunakan Market Intelligence Engine
   • Manfaatkan data trending dari Meilisearch untuk pengambilan keputusan

2. STRATEGI PRICING  
   • Gunakan AI Price Optimizer untuk harga kompetitif otomatis
   • Terapkan dynamic pricing berdasarkan demand real-time
   • Pertimbangkan flash sale untuk meningkatkan velocity penjualan

3. KONTEN & MARKETING
   • Buat konten produk yang SEO-friendly untuk semua marketplace
   • Jadwalkan posting di jam peak engagement (19:00-22:00 WIB)
   • Manfaatkan affiliate marketing untuk jangkauan lebih luas

4. OPERASIONAL
   • Sinkronkan stok antar marketplace secara otomatis
   • Aktifkan notifikasi WhatsApp untuk pesanan masuk
   • Monitor KPI harian melalui Dashboard Analitik Eksekutif

💡 TIP: Gunakan modul Pabrik Konten AI untuk generate deskripsi produk secara massal dan hemat waktu hingga 80%.`
};

app.post('/api/content/generate', async (req, res) => {
  const { prompt, type } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt tidak boleh kosong' });

  const contentType = type || 'Deskripsi';
  const projectId = `PRJ-NEW-${Date.now().toString(36).toUpperCase()}`;
  let generatedText = '';

  // Try Gemini API if key is available
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompts = {
        Deskripsi: `Kamu copywriter e-commerce profesional Indonesia. Buatkan deskripsi produk menarik, informatif, SEO-friendly untuk: ${prompt}. Format: headline, deskripsi utama 2-3 paragraf, 5 bullet keunggulan, CTA. Bahasa Indonesia natural, tanpa markdown.`,
        'Social Media': `Kamu social media specialist Indonesia. Buatkan konten posting untuk produk: ${prompt}. Format: caption Instagram (dengan emoji & hashtag), caption TikTok (pendek & catchy), caption Facebook Marketplace. Bahasa gaul Indonesia.`,
        Marketing: `Kamu digital marketing expert Indonesia. Buatkan materi marketing untuk: ${prompt}. Format: 3 variasi headline iklan, 2 deskripsi ads, 3 USP, target audience, 5-10 keywords SEO. Bahasa profesional & persuasif.`,
        Custom: `Kamu AI assistant bisnis e-commerce Indonesia. Bantu dengan: ${prompt}. Berikan respons detail, profesional, actionable dalam bahasa Indonesia.`
      };

      const systemPrompt = prompts[contentType] || prompts.Custom;
      const result = await model.generateContent(systemPrompt);
      generatedText = result.response.text();
    } catch (err) {
      console.warn('[Gemini] Error:', err.message, '— menggunakan fallback');
      const fallbackFn = FALLBACK_CONTENT[contentType] || FALLBACK_CONTENT.Custom;
      generatedText = fallbackFn(prompt);
    }
  } else {
    const fallbackFn = FALLBACK_CONTENT[contentType] || FALLBACK_CONTENT.Custom;
    generatedText = fallbackFn(prompt);
  }

  const contentData = {
    id: projectId,
    type: contentType,
    prompt,
    content: generatedText,
    status: 'completed',
    created_at: new Date().toISOString()
  };
  generatedContent.set(projectId, contentData);

  res.json({ success: true, message: 'Konten berhasil digenerate', data: contentData });
});

app.get('/api/content/result/:id', (req, res) => {
  const content = generatedContent.get(req.params.id);
  if (content) res.json({ success: true, data: content });
  else res.status(404).json({ error: 'Konten tidak ditemukan' });
});

app.get('/api/content/generated', (req, res) => {
  const all = Array.from(generatedContent.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ success: true, data: all, total: all.length });
});

// ─── Scrape Status ────────────────────────────────────────────────
app.get('/api/scrape/status', (req, res) => {
  res.json(SCRAPE_LOGS.slice(0, 10));
});

// ─── TikTok Status ────────────────────────────────────────────────
app.get('/api/tiktok/status', (req, res) => {
  res.json({
    status: 'configured',
    message: 'TikTok Shop Open API aktif (mode standalone)',
    client_key_set: true,
    client_secret_set: true,
    client_key_preview: 'awttsl***',
    api_base: 'https://open-api.tiktokglobalshop.com',
    mode: 'Standalone Mock Mode'
  });
});

// ─── Credentials / API Keys ───────────────────────────────────────
app.get('/api/credentials/keys', (req, res) => {
  res.json(API_KEYS);
});

app.post('/api/credentials/keys', (req, res) => {
  const { platform, api_key, permissions, quota } = req.body;
  if (!platform || !api_key) return res.status(400).json({ error: 'Platform dan API Key wajib diisi' });

  const perms = Array.isArray(permissions) ? permissions : ['READ'];
  const existingIdx = API_KEYS.findIndex(k => k.platform === platform);
  if (existingIdx >= 0) {
    API_KEYS[existingIdx] = { ...API_KEYS[existingIdx], api_key, permissions: perms, quota: quota || 'No Limit' };
    return res.status(200).json({ success: true, key: API_KEYS[existingIdx] });
  }

  const newKey = { id: apiKeyIdCounter++, platform, api_key, permissions: perms, quota: quota || 'No Limit', created_at: new Date().toISOString() };
  API_KEYS.push(newKey);
  res.status(201).json({ success: true, key: newKey });
});

app.get('/api/credentials/logs', (req, res) => {
  res.json(SCRAPE_LOGS.slice(0, 20));
});

// ─── Revenue Engine ───────────────────────────────────────────────
app.get('/api/revenue/overview', (req, res) => {
  const completed = ORDERS.filter(o => o.status === 'COMPLETED');
  const total = completed.reduce((s, o) => s + o.amount, 0);
  const affiliate = completed.filter(o => o.platform === 'Affiliate').reduce((s, o) => s + o.amount, 0);
  const margin = completed.filter(o => o.platform === 'Margin').reduce((s, o) => s + o.amount, 0);
  const subscription = completed.filter(o => o.platform === 'Subscription').reduce((s, o) => s + o.amount, 0);
  const marketplace = completed.filter(o => o.platform === 'Marketplace').reduce((s, o) => s + o.amount, 0);

  res.json({
    total_revenue: total,
    total_orders: completed.length,
    growth_pct: 12.4,
    breakdown: { affiliate, margin, subscription, marketplace }
  });
});

app.get('/api/revenue/transactions', (req, res) => {
  res.json(ORDERS.slice(0, 20));
});

// ─── Orders & Products ────────────────────────────────────────────
app.get('/api/orders', (req, res) => {
  res.json(ORDERS);
});

app.get('/api/products', (req, res) => {
  res.json(PRODUCTS.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock, sold: p.sold_count })));
});

// ─── Social Post Scheduling ───────────────────────────────────────
app.post('/api/social/schedule', (req, res) => {
  const { caption, platforms, scheduled_at } = req.body;
  if (!caption || !platforms || !scheduled_at) return res.status(400).json({ error: 'Field tidak lengkap' });

  const post = {
    id: socialPostIdCounter++,
    caption,
    platforms: Array.isArray(platforms) ? platforms : JSON.parse(platforms),
    scheduled_at,
    status: 'PENDING',
    created_at: new Date().toISOString()
  };
  SOCIAL_POSTS.push(post);
  res.status(201).json({ success: true, post });
});

app.get('/api/social/schedule', (req, res) => {
  res.json(SOCIAL_POSTS.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)));
});

app.patch('/api/social/schedule/:id/approve', (req, res) => {
  const post = SOCIAL_POSTS.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ success: false, error: 'Jadwal tidak ditemukan' });
  if (post.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Jadwal sudah diproses' });
  post.status = 'APPROVED';
  res.json({ success: true, post });
});

app.delete('/api/social/schedule/:id', (req, res) => {
  const idx = SOCIAL_POSTS.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, error: 'Jadwal tidak ditemukan' });
  const deleted = SOCIAL_POSTS.splice(idx, 1)[0];
  res.json({ success: true, deleted });
});

// ─── Catch-all: serve index.html ─────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AI Commerce OS berjalan di port ${PORT}`);
  console.log(`📦 ${PRODUCTS.length} produk dimuat | ${ORDERS.length} transaksi | ${API_KEYS.length} API keys`);
  console.log(`🔗 Mode: Standalone (tanpa Docker/PostgreSQL/Redis)`);
});
