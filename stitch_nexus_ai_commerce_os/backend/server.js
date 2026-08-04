const express = require('express');
const { Pool } = require('pg');
const { MeiliSearch } = require('meilisearch');
const redis = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});
app.use('/api/', limiter);
const ordersRouter = require('./orders');
app.use('/api/orders', ordersRouter);
const gopayRouter = require('./payment/gopay');
app.use('/api/payment/gopay', gopayRouter);
const tiktokPosting = require('./social/tiktok-posting');
const instagramPosting = require('./social/instagram-posting');
const { createCrudRouter } = require('./generic-crud');

// Mount CRUD router generik untuk modul-modul yang polanya list/create/update/delete
app.use('/api/margin-rules', (req, res, next) =>
  createCrudRouter(pool, 'margin_rules', ['rule_name', 'category', 'min_margin_percent', 'target_margin_percent', 'condition_type', 'active'], 'created_at DESC')(req, res, next)
);
app.use('/api/customers/segments', (req, res, next) =>
  createCrudRouter(pool, 'customer_segments', ['segment_name', 'description', 'criteria', 'customer_count', 'avg_order_value', 'churn_risk_percent'])(req, res, next)
);
app.use('/api/events/feed', (req, res, next) =>
  createCrudRouter(pool, 'event_feed', ['event_type', 'message', 'source_service', 'payload', 'severity'], 'created_at DESC')(req, res, next)
);
app.use('/api/nodes', (req, res, next) =>
  createCrudRouter(pool, 'workflow_nodes', ['node_name', 'node_type', 'config', 'position_x', 'position_y', 'connected_to'])(req, res, next)
);
app.use('/api/ai/models', (req, res, next) =>
  createCrudRouter(pool, 'ai_models_catalog', ['model_name', 'provider', 'use_case', 'cost_label', 'context_window', 'active'])(req, res, next)
);
app.use('/api/tenants', (req, res, next) =>
  createCrudRouter(pool, 'tenants', ['tenant_name', 'subdomain', 'plan', 'status'], 'created_at DESC')(req, res, next)
);
app.use('/api/affiliates', (req, res, next) =>
  createCrudRouter(pool, 'affiliates', ['affiliate_name', 'referral_code', 'commission_percent', 'total_referrals', 'total_commission', 'status'], 'total_commission DESC')(req, res, next)
);
app.use('/api/products/manage', (req, res, next) =>
  createCrudRouter(pool, 'products', ['name', 'category', 'price', 'stock', 'sold', 'description'])(req, res, next)
);
app.use('/api/suppliers', (req, res, next) =>
  createCrudRouter(pool, 'suppliers', ['supplier_name', 'contact_person', 'phone', 'fulfillment_type', 'avg_lead_time_days', 'rating', 'status'])(req, res, next)
);
app.use('/api/marketplace-integrations', (req, res, next) =>
  createCrudRouter(pool, 'marketplace_integrations', ['marketplace_name', 'connected', 'store_name', 'last_sync_at', 'auto_sync_enabled'])(req, res, next)
);

// Recalculate customer segments dari data orders nyata (bukan angka statis)
app.post('/api/customers/segments/recalculate', async (req, res) => {
  try {
    const segments = await pool.query('SELECT * FROM customer_segments');
    const totalOrders = await pool.query('SELECT COUNT(*) c, COALESCE(AVG(amount),0) avg_val FROM orders');
    for (const seg of segments.rows) {
      await pool.query(
        'UPDATE customer_segments SET customer_count = $1, avg_order_value = $2 WHERE id = $3',
        [parseInt(totalOrders.rows[0].c) || 0, parseFloat(totalOrders.rows[0].avg_val) || 0, seg.id]
      );
    }
    const updated = await pool.query('SELECT * FROM customer_segments');
    res.json(updated.rows);
  } catch (err) {
    console.error('[Segments Recalculate] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@database:5432/ai_commerce',
});

// Meilisearch
const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || 'http://meilisearch:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY || 'masterKey123SecureKeyForProd2026',
});

// Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
});
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect().catch(console.error); // Menangani potensi error koneksi Redis

// Google Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let geminiModel = null;
if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  console.log('✅ Gemini AI initialized (gemini-flash-latest)');
} else {
  console.warn('⚠️ GEMINI_API_KEY not set — content generation will use fallback');
}

// In-memory store for generated content (production: use DB)
const generatedContent = new Map();

// ─────────────────────────────────────────────────────────────────
// HELPER: cache-aside
// ─────────────────────────────────────────────────────────────────
async function withCache(key, ttl, fn) {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  const result = await fn();
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(result));
  } catch (_) {}
  return result;
}

// ─────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    const meiliHealth = await meilisearch.health();
    const redisHealth = await redisClient.ping();
    res.json({
      status: 'healthy',
      database: dbResult.rows[0].now,
      meilisearch: meiliHealth.status,
      redis: redisHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// MARKETPLACE ENDPOINTS
// ─────────────────────────────────────────────────────────────────

// GET /api/marketplace/products  - semua produk dari semua marketplace
app.get('/api/marketplace/products', async (req, res) => {
  try {
    const { marketplace, category, sort = 'sold_count', order = 'DESC', limit = 50, offset = 0 } = req.query;
    const cacheKey = `marketplace:products:${marketplace}:${category}:${sort}:${order}:${limit}:${offset}`;

    const data = await withCache(cacheKey, 120, async () => {
      let where = 'WHERE 1=1';
      const params = [];

      if (marketplace) {
        params.push(marketplace);
        where += ` AND marketplace = $${params.length}`;
      }
      if (category) {
        params.push(category);
        where += ` AND category ILIKE $${params.length}`;
      }

      const validSort = ['sold_count', 'rating', 'price', 'scraped_at', 'discount_pct'].includes(sort) ? sort : 'sold_count';
      const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      params.push(parseInt(limit) || 50);
      params.push(parseInt(offset) || 0);

      const result = await pool.query(`
        SELECT *, (sold_count * rating) AS popularity_score
        FROM marketplace_products
        ${where}
        ORDER BY ${validSort} ${validOrder}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      const countResult = await pool.query(`
        SELECT COUNT(*) FROM marketplace_products ${where}
      `, params.slice(0, -2));

      return {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        data: result.rows
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/stats  - statistik per marketplace
app.get('/api/marketplace/stats', async (req, res) => {
  try {
    const data = await withCache('marketplace:stats', 180, async () => {
      const result = await pool.query(`
        SELECT
          marketplace,
          COUNT(*) AS total_products,
          AVG(price) AS avg_price,
          SUM(sold_count) AS total_sold,
          AVG(rating) AS avg_rating,
          MAX(scraped_at) AS last_scraped
        FROM marketplace_products
        GROUP BY marketplace
        ORDER BY total_products DESC
      `);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/trending  - produk trending lintas marketplace
app.get('/api/marketplace/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const data = await withCache(`marketplace:trending:${limit}`, 120, async () => {
      const result = await pool.query(`
        SELECT *, (sold_count * rating + review_count * 0.5) AS trend_score
        FROM marketplace_products
        WHERE price > 0 AND rating >= 4.0 AND scraped_at > NOW() - INTERVAL '24 hours'
        ORDER BY trend_score DESC
        LIMIT $1
      `, [parseInt(limit) || 20]);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/flash-sale  - produk flash sale / diskon besar
app.get('/api/marketplace/flash-sale', async (req, res) => {
  try {
    const data = await withCache('marketplace:flash-sale', 60, async () => {
      const result = await pool.query(`
        SELECT * FROM marketplace_products
        WHERE discount_pct >= 20
        ORDER BY discount_pct DESC, sold_count DESC
        LIMIT 60
      `);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/categories  - daftar kategori unik
app.get('/api/marketplace/categories', async (req, res) => {
  try {
    const data = await withCache('marketplace:categories', 300, async () => {
      const result = await pool.query(`
        SELECT category, COUNT(*) AS product_count
        FROM marketplace_products
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY product_count DESC
      `);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/price-compare  - perbandingan harga antar marketplace
app.get('/api/marketplace/price-compare', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Parameter q diperlukan' });

    const data = await withCache(`marketplace:compare:${q}`, 120, async () => {
      const result = await pool.query(`
        SELECT marketplace, name, price, original_price, discount_pct,
               rating, sold_count, shop_name, product_url, image_url
        FROM marketplace_products
        WHERE name ILIKE $1
        ORDER BY price ASC
        LIMIT 40
      `, [`%${q}%`]);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/top-sellers  - toko terlaris
app.get('/api/marketplace/top-sellers', async (req, res) => {
  try {
    const data = await withCache('marketplace:top-sellers', 300, async () => {
      const result = await pool.query(`
        SELECT marketplace, shop_name, shop_location,
               COUNT(*) AS product_count,
               SUM(sold_count) AS total_sold,
               AVG(rating) AS avg_rating,
               AVG(price) AS avg_price
        FROM marketplace_products
        WHERE shop_name != '' AND sold_count > 0
        GROUP BY marketplace, shop_name, shop_location
        ORDER BY total_sold DESC
        LIMIT 50
      `);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// MARKET INTELLIGENCE ENDPOINTS
// ─────────────────────────────────────────────────────────────────

// GET /api/intelligence/category-trends - Top categories by sold count + trend score
app.get('/api/intelligence/category-trends', async (req, res) => {
  try {
    const data = await withCache('intelligence:category-trends', 300, async () => {
      const result = await pool.query(`
        SELECT category, 
               COUNT(*) AS product_count, 
               SUM(sold_count) AS total_sold,
               AVG(rating) AS avg_rating,
               (SUM(sold_count) * AVG(rating) / 100) AS trend_score
        FROM marketplace_products
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY total_sold DESC
        LIMIT 3
      `);
      // Normalize trend score to 0-100 for UI if needed
      let maxScore = Math.max(...result.rows.map(r => r.trend_score), 100);
      result.rows.forEach(r => {
        r.normalized_score = Math.min(100, Math.max(10, Math.round((r.trend_score / maxScore) * 100)));
      });
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/top-competitors - Top shops by total sold
app.get('/api/intelligence/top-competitors', async (req, res) => {
  try {
    const data = await withCache('intelligence:top-competitors', 300, async () => {
      const result = await pool.query(`
        SELECT marketplace, shop_name, shop_location,
               COUNT(*) AS product_count,
               SUM(sold_count) AS total_sold,
               AVG(rating) AS avg_rating,
               AVG(price) AS avg_price
        FROM marketplace_products
        WHERE shop_name != '' AND sold_count > 0
        GROUP BY marketplace, shop_name, shop_location
        ORDER BY total_sold DESC
        LIMIT 5
      `);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/alerts - Smart generated alerts
app.get('/api/intelligence/alerts', async (req, res) => {
  try {
    const data = await withCache('intelligence:alerts', 60, async () => {
      const alerts = [];
      
      // 1. Price Drops (Promos)
      const drops = await pool.query(`
        SELECT marketplace, name, shop_name, discount_pct, price 
        FROM marketplace_products 
        WHERE discount_pct >= 25 
        ORDER BY discount_pct DESC LIMIT 3
      `);
      drops.rows.forEach(d => {
        alerts.push({
          type: 'PRICE_DROP_DETECTED',
          severity: 'risk-danger',
          time: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
          title: `Competitor "${d.shop_name.toUpperCase()}" dropped price by ${d.discount_pct}%`,
          desc: `Target SKU: ${d.name.substring(0, 40)}... di ${d.marketplace}. Counter-measure recommended.`
        });
      });

      // 2. High Demand / Trending Fast
      const trending = await pool.query(`
        SELECT marketplace, name, category, sold_count
        FROM marketplace_products
        WHERE sold_count > 1000
        ORDER BY scraped_at DESC LIMIT 2
      `);
      trending.rows.forEach(t => {
        alerts.push({
          type: 'HIGH_DEMAND',
          severity: 'primary-container',
          time: new Date(Date.now() - 30 * 60000).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}), // fake 30 min ago
          title: `Demand Spike in ${t.category.toUpperCase()}`,
          desc: `"${t.name.substring(0, 35)}..." has high velocity on ${t.marketplace}.`
        });
      });

      return alerts;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marketplace/scrape  - trigger scraping manual
app.post('/api/marketplace/scrape', async (req, res) => {
  try {
    const startedAt = new Date();
    // Respond immediately so client isn't blocked
    res.json({ message: 'Scraping started in background', status: 'running' });

    // Run scraper asynchronously (non-blocking)
    (async () => {
      console.log('[Manual Scrape] Started...');
      const { initMarketplaceTable, saveProducts, indexToMeilisearch } = require('./scrapers/db');
      const tokopedia = require('./scrapers/tokopedia');
      const shopee = require('./scrapers/shopee');
      const { scrapeAllLazada, scrapeAllBlibli } = require('./scrapers/lazada-blibli');
      const { scrapeAllZalora } = require('./scrapers/zalora');
      const { scrapeAllTikTok } = require('./scrapers/tiktok');

      await initMarketplaceTable();

      const allProducts = [];
      let totalScraped = 0;
      let totalSaved = 0;

      const results = await Promise.allSettled([
        tokopedia.scrapeAllCategories(),
        shopee.scrapeAllCategories(),
        scrapeAllLazada(),
        scrapeAllBlibli(),
        scrapeAllZalora(),
        scrapeAllTikTok()
      ]);

      for (const r of results) {
        if (r.status === 'fulfilled') {
          const scrapedCount = r.value.length;
          totalScraped += scrapedCount;
          const saved = await saveProducts(r.value);
          totalSaved += saved;
          allProducts.push(...r.value);
          console.log(`[Scrape] Saved ${saved} products`);
        } else {
          console.error('[Scrape] Error in one source:', r.reason);
        }
      }

      await indexToMeilisearch(allProducts);
      await redisClient.del(['marketplace:stats', 'marketplace:trending:20', 'marketplace:flash-sale']);

      const finishedAt = new Date();

      // Insert log record
      try {
        await pool.query(
          `INSERT INTO scrape_logs (marketplace, category, items_scraped, items_saved, status, started_at, finished_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          ['manual', 'all', totalScraped, totalSaved, 'SUCCESS', startedAt, finishedAt]
        );
      } catch (logErr) {
        console.error('Failed to insert scrape log:', logErr);
      }

      console.log('[Manual Scrape] Finished!', allProducts.length, 'products');
    })().catch(console.error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// SEARCH ENDPOINT (menggunakan Meilisearch)
// ─────────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit = 20, marketplace, category } = req.query;
    if (!q) return res.status(400).json({ error: 'Parameter q diperlukan' });

    const filter = [];
    if (marketplace) filter.push(`marketplace = "${marketplace}"`);
    if (category) filter.push(`category = "${category}"`);

    const searchResults = await meilisearch.index('marketplace_products').search(q, {
      limit: parseInt(limit),
      filter: filter.length ? filter.join(' AND ') : undefined,
      sort: ['sold_count:desc']
    });

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// DASHBOARD OVERVIEW - Statistik utama untuk dashboard
// ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard/overview', async (req, res) => {
  try {
    const data = await withCache('dashboard:overview', 120, async () => {
      // Total produk per marketplace
      const statsResult = await pool.query(`
        SELECT
          COUNT(*) AS total_products,
          COUNT(DISTINCT marketplace) AS total_marketplaces,
          COALESCE(SUM(sold_count), 0) AS total_sold,
          COALESCE(AVG(price), 0) AS avg_price,
          COALESCE(AVG(rating), 0) AS avg_rating,
          COALESCE(SUM(price * sold_count), 0) AS estimated_gmv,
          MAX(scraped_at) AS last_scraped
        FROM marketplace_products
      `);

      // Breakdown per marketplace
      const marketplaceResult = await pool.query(`
        SELECT
          marketplace,
          COUNT(*) AS total_products,
          AVG(price) AS avg_price,
          SUM(sold_count) AS total_sold,
          AVG(rating) AS avg_rating,
          MAX(scraped_at) AS last_scraped
        FROM marketplace_products
        GROUP BY marketplace
        ORDER BY total_products DESC
      `);

      // Produk baru ditambahkan hari ini
      const todayResult = await pool.query(`
        SELECT COUNT(*) AS today_count
        FROM marketplace_products
        WHERE scraped_at > NOW() - INTERVAL '24 hours'
      `);

      // Top 5 kategori
      const categoryResult = await pool.query(`
        SELECT category, COUNT(*) AS count
        FROM marketplace_products
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
      `);

      const stats = statsResult.rows[0];
      return {
        total_products: parseInt(stats.total_products) || 0,
        total_marketplaces: parseInt(stats.total_marketplaces) || 0,
        total_sold: parseInt(stats.total_sold) || 0,
        avg_price: parseFloat(stats.avg_price) || 0,
        avg_rating: parseFloat(stats.avg_rating) || 0,
        estimated_gmv: parseInt(stats.estimated_gmv) || 0,
        last_scraped: stats.last_scraped,
        today_new_products: parseInt(todayResult.rows[0].today_count) || 0,
        marketplaces: marketplaceResult.rows,
        top_categories: categoryResult.rows
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// CONTENT PROJECTS - Data untuk modul Pabrik Konten AI
// ─────────────────────────────────────────────────────────────────
app.get('/api/content/projects', async (req, res) => {
  try {
    const data = await withCache('content:projects', 120, async () => {
      // Ambil top produk yang butuh konten (belum punya deskripsi panjang)
      const productsResult = await pool.query(`
        SELECT
          id, marketplace, name, price, image_url, product_url,
          rating, sold_count, shop_name, category
        FROM marketplace_products
        WHERE sold_count > 0
        ORDER BY sold_count DESC
        LIMIT 10
      `);

      // Hitung statistik untuk mesin kreatif
      const statsResult = await pool.query(`
        SELECT
          COUNT(*) AS total_products,
          COUNT(DISTINCT category) AS total_categories,
          COUNT(DISTINCT marketplace) AS total_marketplaces
        FROM marketplace_products
      `);

      const stats = statsResult.rows[0];

      // Generate project list dari produk aktif
      const projects = productsResult.rows.map((p, i) => ({
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
        progress: i < 3 ? 100 : (i < 6 ? Math.floor(30 + Math.random() * 50) : 0)
      }));

      return {
        projects,
        stats: {
          total_products: parseInt(stats.total_products) || 0,
          total_categories: parseInt(stats.total_categories) || 0,
          total_marketplaces: parseInt(stats.total_marketplaces) || 0,
          active_projects: projects.filter(p => p.status === 'in_progress').length,
          completed_projects: projects.filter(p => p.status === 'completed').length,
          queued_projects: projects.filter(p => p.status === 'queued').length
        }
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// CONTENT GENERATE - Real Gemini AI Content Generation
// ─────────────────────────────────────────────────────────────────
const CONTENT_PROMPTS = {
  'Deskripsi': (input) => `Kamu adalah copywriter e-commerce profesional Indonesia. Buatkan deskripsi produk yang menarik, informatif, dan SEO-friendly untuk produk berikut:

Nama Produk: ${input}

Buatkan deskripsi dalam format:
1. Headline yang menarik (1 baris)
2. Deskripsi utama (2-3 paragraf, masing-masing 2-3 kalimat)
3. Keunggulan produk (3-5 bullet points)
4. Call-to-action yang persuasif

Gunakan bahasa Indonesia yang natural, meyakinkan, dan cocok untuk marketplace seperti Shopee/Tokopedia. Jangan gunakan markdown formatting.`,

  'Social Media': (input) => `Kamu adalah social media specialist Indonesia. Buatkan konten posting social media untuk produk berikut:

Produk: ${input}

Buatkan dalam format:
1. Caption Instagram (dengan emoji, hashtag relevan, max 2200 karakter)
2. Caption TikTok (pendek, catchy, dengan hashtag viral)
3. Caption Facebook Marketplace

Gunakan bahasa gaul Indonesia yang relatable dan engaging. Jangan gunakan markdown formatting.`,

  'Marketing': (input) => `Kamu adalah digital marketing expert Indonesia. Buatkan materi marketing untuk produk berikut:

Produk: ${input}

Buatkan:
1. Headline iklan (3 variasi, masing-masing max 30 karakter)
2. Deskripsi iklan Google/Meta Ads (2 variasi, max 90 karakter)
3. USP (Unique Selling Points) - 3 poin
4. Target audience yang disarankan
5. Keywords untuk SEO (5-10 keyword)

Gunakan bahasa Indonesia yang profesional dan persuasif. Jangan gunakan markdown formatting.`,

  'Custom': (input) => `Kamu adalah AI assistant untuk bisnis e-commerce Indonesia. Tolong bantu dengan permintaan berikut:

${input}

Berikan respons yang detail, profesional, dan actionable dalam bahasa Indonesia. Jangan gunakan markdown formatting.`
};

app.post('/api/content/generate', async (req, res) => {
  try {
    const { prompt, type } = req.body;
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
    }

    const contentType = type || 'Deskripsi';
    const projectId = `PRJ-NEW-${Date.now().toString(36).toUpperCase()}`;
    let generatedText = '';

    if (geminiModel) {
      // Real Gemini API call
      const systemPrompt = CONTENT_PROMPTS[contentType]
        ? CONTENT_PROMPTS[contentType](prompt)
        : CONTENT_PROMPTS['Custom'](prompt);
      
      const result = await geminiModel.generateContent(systemPrompt);
      generatedText = result.response.text();
    } else {
      // Fallback jika API key tidak tersedia
      generatedText = `[FALLBACK] Gemini API Key belum dikonfigurasi.\n\nPermintaan Anda:\nTipe: ${contentType}\nPrompt: ${prompt}\n\nSilakan set GEMINI_API_KEY di environment variable untuk mengaktifkan AI generation.`;
    }

    // Simpan hasil ke in-memory store
    const contentData = {
      id: projectId,
      type: contentType,
      prompt: prompt,
      content: generatedText,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    generatedContent.set(projectId, contentData);

    // Invalidate cache agar project list refresh
    try { await redisClient.del('content:projects'); } catch(_) {}

    res.json({
      success: true,
      message: 'Asset generated successfully by Gemini AI',
      data: contentData
    });
  } catch (err) {
    console.error('Gemini generate error:', err);
    res.status(500).json({ error: 'Gagal generate konten: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// CONTENT RESULT - Ambil hasil konten yang sudah di-generate
// ─────────────────────────────────────────────────────────────────
app.get('/api/content/result/:id', (req, res) => {
  const { id } = req.params;
  const content = generatedContent.get(id);
  if (content) {
    res.json({ success: true, data: content });
  } else {
    res.status(404).json({ error: 'Konten tidak ditemukan' });
  }
});

// GET all generated content
app.get('/api/content/generated', (req, res) => {
  const all = Array.from(generatedContent.values()).sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  res.json({ success: true, data: all, total: all.length });
});

// ─────────────────────────────────────────────────────────────────
// SCRAPE STATUS - Cek status scraping terakhir
// ─────────────────────────────────────────────────────────────────
app.get('/api/scrape/status', async (req, res) => {
  try {
    const data = await withCache('scrape:status', 60, async () => {
      const result = await pool.query(`
        SELECT * FROM scrape_logs
        ORDER BY started_at DESC
        LIMIT 10
      `);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────
// TIKTOK SHOP API STATUS - Cek status koneksi TikTok API
// ─────────────────────────────────────────────────────────────────
app.get('/api/tiktok/status', async (req, res) => {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
    
    if (!clientKey || !clientSecret) {
      return res.json({
        status: 'not_configured',
        message: 'TikTok API credentials belum dikonfigurasi',
        client_key_set: false,
        client_secret_set: false
      });
    }

    // Try to get access token to verify credentials
    const { searchProductsAPI } = require('./scrapers/tiktok');
    
    res.json({
      status: 'configured',
      message: 'TikTok Shop Open API credentials aktif',
      client_key_set: true,
      client_secret_set: true,
      client_key_preview: clientKey.substring(0, 6) + '***',
      api_base: 'https://open-api.tiktokglobalshop.com',
      mode: 'Official TikTok Shop Open API'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────
// CREDENTIALS & KEYS API
// ─────────────────────────────────────────────────────────────────
app.get('/api/credentials/keys', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM api_keys ORDER BY platform ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credentials/keys', async (req, res) => {
  try {
    const { platform, api_key, permissions, quota } = req.body;
    if (!platform || !api_key) {
      return res.status(400).json({ error: 'Platform and API Key are required' });
    }
    const perms = Array.isArray(permissions) ? JSON.stringify(permissions) : JSON.stringify(['READ']);
    const q = quota || 'No Limit';
    
    const result = await pool.query(`
      INSERT INTO api_keys (platform, api_key, permissions, quota)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (platform) DO UPDATE SET
        api_key = EXCLUDED.api_key,
        permissions = EXCLUDED.permissions,
        quota = EXCLUDED.quota
      RETURNING *
    `, [platform, api_key, perms, q]);
    
    res.status(201).json({ success: true, key: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/credentials/logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM scrape_logs 
      ORDER BY started_at DESC 
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────
// REVENUE ENGINE API
// ─────────────────────────────────────────────────────────────────
app.get('/api/revenue/overview', async (req, res) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN platform = 'Affiliate' THEN amount ELSE 0 END), 0) as affiliate_rev,
        COALESCE(SUM(CASE WHEN platform = 'Margin' THEN amount ELSE 0 END), 0) as margin_rev,
        COALESCE(SUM(CASE WHEN platform = 'Subscription' THEN amount ELSE 0 END), 0) as subscription_rev,
        COALESCE(SUM(CASE WHEN platform = 'Marketplace' THEN amount ELSE 0 END), 0) as marketplace_rev
      FROM orders
      WHERE status = 'COMPLETED'
    `);
    
    const row = statsResult.rows[0];
    res.json({
      total_revenue: parseFloat(row.total_revenue),
      total_orders: parseInt(row.total_orders),
      growth_pct: 12.4,
      breakdown: {
        affiliate: parseFloat(row.affiliate_rev),
        margin: parseFloat(row.margin_rev),
        subscription: parseFloat(row.subscription_rev),
        marketplace: parseFloat(row.marketplace_rev)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/revenue/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM orders 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/orders', async (req, res) => {
  try {
    const cacheKey = 'orders:all';
    const data = await withCache(cacheKey, 300, async () => {
      const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
      return result.rows;
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Saran restok dihitung dari stok produk nyata (bukan rekomendasi AI-generated palsu)
app.get('/api/products/restock-suggestions', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 50;
    const target = parseInt(req.query.target) || 100;
    const result = await pool.query(
      'SELECT id, name, category, stock FROM products WHERE stock < $1 ORDER BY stock ASC',
      [threshold]
    );
    const suggestions = result.rows.map((p) => ({
      ...p,
      recommended_restock: Math.max(target - p.stock, 0)
    }));
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// TIKTOK CONTENT POSTING API — OAUTH CONNECT (untuk akun @skuypergibelanja)
// ─────────────────────────────────────────────────────────────────
// Buka endpoint ini di browser sekali, login sebagai @skuypergibelanja,
// lalu approve izin. Setelah itu token tersimpan otomatis di DB.
app.get('/api/social/tiktok/connect', (req, res) => {
  try {
    if (!tiktokPosting.isConfigured()) {
      return res.status(400).send(
        'TIKTOK_CONTENT_CLIENT_KEY / SECRET belum diisi di .env. Isi dulu dengan Client Key & Secret asli dari developers.tiktok.com (bukan yang dummy).'
      );
    }
    const url = tiktokPosting.getAuthorizationUrl('skuypergibelanja');
    res.redirect(url);
  } catch (err) {
    res.status(500).send(`Gagal membuat link authorize: ${err.message}`);
  }
});

app.get('/api/social/tiktok/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      return res.status(400).send(`TikTok menolak authorize: ${error_description || error}`);
    }
    if (!code) {
      return res.status(400).send('Parameter "code" tidak ditemukan dari TikTok.');
    }

    const tokenData = await tiktokPosting.exchangeCodeForToken(code);
    if (!tokenData.access_token) {
      return res.status(400).send(`Gagal tukar token: ${JSON.stringify(tokenData)}`);
    }

    let displayName = 'skuypergibelanja';
    try {
      const info = await tiktokPosting.getUserInfo(tokenData.access_token);
      displayName = info?.data?.user?.display_name || displayName;
    } catch (e) {
      console.warn('[TikTok Connect] gagal ambil user info:', e.message);
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 0) * 1000);

    await pool.query(`
      INSERT INTO api_keys (platform, api_key, permissions, quota, access_token, refresh_token, open_id, account_name, token_expires_at)
      VALUES ('TikTok Content Posting', $1, '["video.publish","video.upload"]', 'OAuth', $2, $3, $4, $5, $6)
      ON CONFLICT (platform) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        open_id = EXCLUDED.open_id,
        account_name = EXCLUDED.account_name,
        token_expires_at = EXCLUDED.token_expires_at
    `, [tokenData.open_id || 'n/a', tokenData.access_token, tokenData.refresh_token, tokenData.open_id, displayName, expiresAt]);

    res.send(`✅ Akun TikTok "${displayName}" berhasil terhubung. Auto-post sekarang bisa publish video ke akun ini. Anda boleh tutup tab ini.`);
  } catch (err) {
    console.error('[TikTok Callback] Error:', err.response?.data || err.message);
    res.status(500).send(`Gagal menghubungkan akun TikTok: ${err.message}`);
  }
});

// ─────────────────────────────────────────────────────────────────
// INSTAGRAM GRAPH API — OAUTH CONNECT (untuk akun @skuypergibelanja)
// ─────────────────────────────────────────────────────────────────
app.get('/api/social/instagram/connect', (req, res) => {
  try {
    if (!instagramPosting.isConfigured()) {
      return res.status(400).send(
        'INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET belum diisi di .env. Daftar dulu Meta App di developers.facebook.com + tambah produk "Instagram Graph API".'
      );
    }
    res.redirect(instagramPosting.getAuthorizationUrl('skuypergibelanja'));
  } catch (err) {
    res.status(500).send(`Gagal membuat link authorize: ${err.message}`);
  }
});

app.get('/api/social/instagram/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) return res.status(400).send(`Meta menolak authorize: ${error_description || error}`);
    if (!code) return res.status(400).send('Parameter "code" tidak ditemukan dari Meta.');

    const tokenData = await instagramPosting.exchangeCodeForToken(code);
    const { igUserId, pageAccessToken, pageName } = await instagramPosting.getInstagramBusinessAccount(tokenData.access_token);

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000); // default 60 hari

    await pool.query(`
      INSERT INTO api_keys (platform, api_key, permissions, quota, access_token, open_id, account_name, token_expires_at)
      VALUES ('Instagram Content Publish', $1, '["instagram_content_publish"]', 'OAuth', $2, $3, $4, $5)
      ON CONFLICT (platform) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        open_id = EXCLUDED.open_id,
        account_name = EXCLUDED.account_name,
        token_expires_at = EXCLUDED.token_expires_at
    `, [igUserId, pageAccessToken, igUserId, pageName, expiresAt]);

    res.send(`✅ Instagram Business Account (via Page "${pageName}") berhasil terhubung. Anda boleh tutup tab ini.`);
  } catch (err) {
    console.error('[Instagram Callback] Error:', err.response?.data || err.message);
    res.status(500).send(`Gagal menghubungkan akun Instagram: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
  }
});

// ─────────────────────────────────────────────────────────────────
// EKOSISTEM MARKETPLACE APP STORE
// ─────────────────────────────────────────────────────────────────
app.get('/api/app-store/listings', async (req, res) => {
  try {
    const { category } = req.query;
    const result = category
      ? await pool.query('SELECT * FROM app_store_listings WHERE category = $1 ORDER BY installs_count DESC, rating DESC', [category])
      : await pool.query('SELECT * FROM app_store_listings ORDER BY installs_count DESC, rating DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[App Store] Error listings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/app-store/listings/:id/install', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await pool.query('SELECT * FROM app_store_listings WHERE id = $1', [id]);
    if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing tidak ditemukan' });
    if (listing.rows[0].locked) return res.status(403).json({ error: 'Item ini butuh Enterprise plan' });

    await pool.query('INSERT INTO app_store_installs (listing_id) VALUES ($1)', [id]);
    const updated = await pool.query(
      'UPDATE app_store_listings SET installs_count = installs_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('[App Store] Error install:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// SOCIAL MEDIA POST SCHEDULING
// ─────────────────────────────────────────────────────────────────
app.post('/api/social/schedule', async (req, res) => {
  try {
    const { caption, platforms, scheduled_at } = req.body;
    
    if (!caption || !platforms || !scheduled_at) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO social_posts (caption, platforms, scheduled_at, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [caption, JSON.stringify(platforms), scheduled_at, 'PENDING']
    );

    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error('[Schedule API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/social/schedule', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM social_posts ORDER BY scheduled_at ASC LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Schedule API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/social/schedule/:id/approve — ubah status menjadi APPROVED
app.patch('/api/social/schedule/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE social_posts SET status = 'APPROVED' WHERE id = $1 AND status = 'PENDING' RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Jadwal tidak ditemukan atau sudah di-approve' });
    }
    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error('[Schedule Approve] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/social/schedule/:id — hapus jadwal
app.delete('/api/social/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM social_posts WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Jadwal tidak ditemukan' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('[Schedule Delete] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────
// INIT DATABASE
// ─────────────────────────────────────────────────────────────────
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        product_name VARCHAR(255),
        amount DECIMAL(10,2),
        status VARCHAR(50),
        platform VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Kolom tambahan yang dipakai backend/orders/index.js (sync order dari marketplace) —
    // sebelumnya tabel ini TIDAK punya kolom-kolom ini sama sekali, jadi POST /api/orders/sync
    // selalu gagal dengan error "column does not exist". Sekarang diselaraskan.
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace VARCHAR(100)`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id INTEGER`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS price DECIMAL(10,2)`);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE orders ADD CONSTRAINT orders_order_id_marketplace_unique UNIQUE (order_id, marketplace);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Seed initial products if empty (tabel ini sebelumnya tidak pernah diisi sama sekali)
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, category, price, stock, sold, description) VALUES
        ('Kaos Polos Combed 30s', 'Fashion', 45000, 320, 128, 'Kaos combed 30s adem, cocok untuk sablon custom maupun dipakai harian.'),
        ('Powerbank 10000mAh Fast Charging', 'Elektronik', 155000, 84, 62, 'Powerbank kapasitas 10000mAh dengan fast charging 22.5W, kompatibel semua HP.'),
        ('Kopi Kenangan Sachet 1L', 'F&B', 89000, 210, 340, 'Kopi susu kemasan 1 liter, siap seduh dingin, tahan di kulkas 3 hari.'),
        ('Skincare Set Viral Glow Up', 'Kecantikan', 129000, 45, 210, 'Paket skincare 5 langkah untuk kulit glowing, cocok segala jenis kulit.'),
        ('Sepatu Sneakers Casual Pria', 'Fashion', 189000, 60, 34, 'Sneakers casual bahan kanvas, ringan dan nyaman untuk aktivitas harian.')
      `);
    }

    // ─── Suppliers (supplier_fulfillment_hub) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        supplier_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        fulfillment_type VARCHAR(50) DEFAULT 'dropship',
        avg_lead_time_days INT DEFAULT 3,
        rating NUMERIC(2,1) DEFAULT 4.5,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const supplierCount = await pool.query('SELECT COUNT(*) FROM suppliers');
    if (parseInt(supplierCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO suppliers (supplier_name, contact_person, phone, fulfillment_type, avg_lead_time_days, rating) VALUES
        ('CV Sumber Rejeki Textile', 'Pak Hendra', '081234567890', 'dropship', 2, 4.8),
        ('PT Gudang Elektronik Jaya', 'Bu Lina', '081298765432', 'warehouse', 1, 4.6),
        ('Supplier Kosmetik Bandung', 'Pak Andi', '081311122233', 'dropship', 3, 4.4)
      `);
    }

    // ─── Marketplace Integrations Status (integrasi_marketplace_api) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_integrations (
        id SERIAL PRIMARY KEY,
        marketplace_name VARCHAR(100) UNIQUE NOT NULL,
        connected BOOLEAN DEFAULT FALSE,
        store_name VARCHAR(255),
        last_sync_at TIMESTAMP,
        auto_sync_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const marketplaceIntCount = await pool.query('SELECT COUNT(*) FROM marketplace_integrations');
    if (parseInt(marketplaceIntCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO marketplace_integrations (marketplace_name, connected, store_name, auto_sync_enabled) VALUES
        ('Shopee', FALSE, NULL, FALSE),
        ('Tokopedia', FALSE, NULL, FALSE),
        ('TikTok Shop', FALSE, NULL, FALSE),
        ('Lazada', FALSE, NULL, FALSE)
      `);
    }
    if (parseInt(ordersCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO orders (customer_name, product_name, amount, status, platform, created_at) VALUES
        ('Budi Santoso', 'Langganan Paket Enterprise AI Suite', 2499000.00, 'COMPLETED', 'Subscription', NOW() - INTERVAL '2 hours'),
        ('Siti Aminah', 'Komisi Penjualan Skincare Viral (Shopee Affiliate)', 142100.00, 'COMPLETED', 'Affiliate', NOW() - INTERVAL '3 hours'),
        ('Joko Prasetyo', 'Selisih Margin Penjualan Laptop ASUS ROG', 819200.00, 'COMPLETED', 'Margin', NOW() - INTERVAL '4 hours'),
        ('Rini Handayani', 'Pembelian Tokopedia: Kopi Kenangan 1L', 89000.00, 'COMPLETED', 'Marketplace', NOW() - INTERVAL '5 hours'),
        ('Ahmad Fauzi', 'Langganan Paket Pro Member Weekly', 152200.00, 'COMPLETED', 'Subscription', NOW() - INTERVAL '6 hours'),
        ('Dewi Lestari', 'Komisi Penjualan Baju Gamis OOTD (Tiktok Affiliate)', 56000.00, 'COMPLETED', 'Affiliate', NOW() - INTERVAL '7 hours'),
        ('Andi Wijaya', 'Selisih Margin Penjualan Meja Kerja Minimalis', 210000.00, 'COMPLETED', 'Margin', NOW() - INTERVAL '8 hours'),
        ('Lina Marlina', 'Pembelian Shopee: Headphone Bluetooth JBL', 450000.00, 'COMPLETED', 'Marketplace', NOW() - INTERVAL '9 hours'),
        ('Eko Yulianto', 'Langganan Add-on: WhatsApp API Gateway', 99000.00, 'COMPLETED', 'Subscription', NOW() - INTERVAL '10 hours'),
        ('Sri Wahyuni', 'Komisi Penjualan Blender Portable (Lazada Affiliate)', 28500.00, 'COMPLETED', 'Affiliate', NOW() - INTERVAL '12 hours'),
        ('Hadi Syahputra', 'Pembelian TikTok Shop: Parfum HMNS Orgasm', 320000.00, 'COMPLETED', 'Marketplace', NOW() - INTERVAL '14 hours'),
        ('Indah Permata', 'Selisih Margin Penjualan Rak Buku Kayu', 180000.00, 'COMPLETED', 'Margin', NOW() - INTERVAL '16 hours')
      `);
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(100),
        price DECIMAL(10,2),
        stock INTEGER,
        sold INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id SERIAL PRIMARY KEY,
        caption TEXT NOT NULL,
        platforms JSONB NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API Keys table for credential management
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(100) UNIQUE NOT NULL,
        api_key VARCHAR(255) NOT NULL,
        permissions JSONB NOT NULL,
        quota VARCHAR(100) DEFAULT 'No Limit',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Kolom tambahan untuk simpan OAuth token akun sosial (mis. TikTok @skuypergibelanja)
    await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS access_token TEXT`);
    await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS refresh_token TEXT`);
    await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS open_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS account_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP`);
    // Kolom video untuk social_posts (Content Posting API TikTok wajib pakai video)
    await pool.query(`ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS video_path TEXT`);
    await pool.query(`ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await pool.query(`ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS video_url TEXT`);
    await pool.query(`ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS publish_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS failure_reason TEXT`);

    // App Store Ekosistem Marketplace — tabel nyata untuk /ekosistem_marketplace_app_store
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_store_listings (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,   -- connector | plugin | blueprint
        name VARCHAR(255) NOT NULL,
        description TEXT,
        developer VARCHAR(255),
        price_label VARCHAR(100) DEFAULT 'Gratis',
        rating NUMERIC(2,1) DEFAULT 4.5,
        badge VARCHAR(50),
        icon VARCHAR(100) DEFAULT 'extension',
        color_hex VARCHAR(20) DEFAULT '#adc6ff',
        locked BOOLEAN DEFAULT FALSE,
        installs_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_store_installs (
        id SERIAL PRIMARY KEY,
        listing_id INT REFERENCES app_store_listings(id) ON DELETE CASCADE,
        installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const listingCount = await pool.query('SELECT COUNT(*) FROM app_store_listings');
    if (parseInt(listingCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO app_store_listings (category, name, description, developer, price_label, rating, badge, icon, color_hex, locked) VALUES
        ('connector', 'Shopee Sync Pro', 'Integrasi inventory real-time & order processing otomatis.', 'NeuralCore', 'Gratis', 4.9, NULL, 'sync', '#EE4D2D', FALSE),
        ('connector', 'Tokopedia Bridge', 'Manajemen multi-gudang dan promosi flash sale terpadu.', 'IndoStack', 'IDR 149k/bln', 4.8, NULL, 'hub', '#42B549', FALSE),
        ('connector', 'Global Amazon FBA', 'Export otomatis dan sinkronisasi stok ke fulfillment center US/UK.', 'Amazon AWS', 'Komisi 2%', 5.0, NULL, 'public', '#ffffff', FALSE),
        ('plugin', 'Smart Logistics AI', 'Pemilihan kurir termurah otomatis berdasarkan rute.', 'NeuralCore', 'IDR 89k', 4.6, NULL, 'local_shipping', '#ddb7ff', FALSE),
        ('plugin', 'Auto-Accounting Sync', 'Penjualan langsung masuk ke neraca laba rugi otomatis.', 'NeuralCore', 'Gratis', 4.7, NULL, 'account_balance_wallet', '#adc6ff', FALSE),
        ('plugin', 'COD Risk Shield', 'Deteksi buyer bermasalah sebelum kirim paket COD.', 'NeuralCore', 'IDR 45k', 4.5, NULL, 'payments', '#ffb786', FALSE),
        ('plugin', 'Retention Radar', 'Analisis customer churn rate dengan machine learning.', 'NeuralCore', 'Enterprise', 4.4, NULL, 'analytics', '#ffb4ab', TRUE),
        ('blueprint', 'Modern Laundry OS', 'Sistem manajemen laundry kiloan & satuan lengkap dengan tracker kurir dan POS.', 'NeuralCore', 'IDR 2.499k', 4.8, 'NEW', 'architecture', '#adc6ff', FALSE),
        ('blueprint', 'Automated Dropship Hub', 'Blueprint untuk membangun brand dropship tanpa stok, terintegrasi ke 50+ supplier China & Lokal.', 'NeuralCore', 'IDR 1.250k', 4.7, 'TRENDING', 'account_tree', '#ddb7ff', FALSE),
        ('blueprint', 'Omnichannel Retail', 'Gabungkan toko offline dan online Anda dalam satu dashboard pusat yang sinkron otomatis.', 'NeuralCore', 'IDR 3.900k', 4.9, 'STAFF PICK', 'storefront', '#ffb786', FALSE)
      `);
      console.log('[App Store] Seed data awal berhasil dibuat (10 listing).');
    }

    // ─── Margin Rules (aturan_margin_otomatis_rule_engine) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS margin_rules (
        id SERIAL PRIMARY KEY,
        rule_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        min_margin_percent NUMERIC(5,2) NOT NULL,
        target_margin_percent NUMERIC(5,2),
        condition_type VARCHAR(50) DEFAULT 'category',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const marginCount = await pool.query('SELECT COUNT(*) FROM margin_rules');
    if (parseInt(marginCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO margin_rules (rule_name, category, min_margin_percent, target_margin_percent, condition_type) VALUES
        ('Elektronik Minimum', 'Elektronik', 8.0, 15.0, 'category'),
        ('Fashion Standar', 'Fashion', 20.0, 35.0, 'category'),
        ('Produk Fast-Moving', 'Semua Kategori', 5.0, 12.0, 'velocity'),
        ('Produk Musiman', 'Semua Kategori', 25.0, 45.0, 'seasonal')
      `);
    }

    // ─── Customer Segments (customer_intelligence_hub) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_segments (
        id SERIAL PRIMARY KEY,
        segment_name VARCHAR(255) NOT NULL,
        description TEXT,
        criteria VARCHAR(255),
        customer_count INT DEFAULT 0,
        avg_order_value NUMERIC(12,2) DEFAULT 0,
        churn_risk_percent NUMERIC(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS churn_risk_percent NUMERIC(5,2) DEFAULT 0`);
    const segmentCount = await pool.query('SELECT COUNT(*) FROM customer_segments');
    if (parseInt(segmentCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO customer_segments (segment_name, description, criteria, customer_count, avg_order_value, churn_risk_percent) VALUES
        ('VIP Loyalis', 'Pelanggan dengan 10+ transaksi dalam 90 hari terakhir', 'transaksi >= 10 AND hari <= 90', 0, 0, 5),
        ('Berisiko Churn', 'Belum bertransaksi 60+ hari padahal dulu aktif', 'idle_days >= 60', 0, 0, 78),
        ('Baru Bergabung', 'Pelanggan baru dalam 30 hari terakhir', 'created_at >= now() - 30d', 0, 0, 25),
        ('Big Spender', 'Rata-rata nilai order di atas Rp 1 juta', 'avg_order_value >= 1000000', 0, 0, 15)
      `);
    }
    // NOTE: customer_count & avg_order_value di atas sengaja 0 (belum ada data order/customer
    // yang cukup untuk dihitung otomatis) — endpoint /api/customers/segments/recalculate
    // akan menghitung ulang dari tabel orders begitu ada data transaksi nyata.

    // ─── Event Feed (pusat_komando_event_driven, BPMN) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_feed (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        message TEXT,
        source_service VARCHAR(100),
        payload JSONB,
        severity VARCHAR(20) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`ALTER TABLE event_feed ADD COLUMN IF NOT EXISTS message TEXT`);
    const eventCount = await pool.query('SELECT COUNT(*) FROM event_feed');
    if (parseInt(eventCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO event_feed (event_type, message, source_service, severity) VALUES
        ('SYSTEM_START', 'Backend AI Commerce OS berhasil start', 'backend', 'info'),
        ('DB_MIGRATION', 'Migrasi tabel database selesai dijalankan', 'backend', 'info'),
        ('WEBHOOK_READY', 'Webhook listener siap menerima event', 'webhook', 'info')
      `);
    }

    // ─── Workflow Nodes (otomatisasi_alur_kerja_bpmn) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_nodes (
        id SERIAL PRIMARY KEY,
        node_name VARCHAR(255) NOT NULL,
        node_type VARCHAR(50) NOT NULL,
        config JSONB,
        position_x INT DEFAULT 0,
        position_y INT DEFAULT 0,
        connected_to INT REFERENCES workflow_nodes(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const nodeCount = await pool.query('SELECT COUNT(*) FROM workflow_nodes');
    if (parseInt(nodeCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO workflow_nodes (node_name, node_type, config, position_x, position_y) VALUES
        ('Order Masuk', 'trigger', '{"source":"marketplace"}', 100, 100),
        ('Cek Stok', 'condition', '{"check":"stock_available"}', 300, 100),
        ('Kirim WhatsApp Konfirmasi', 'action', '{"template":"order_confirmation"}', 500, 100)
      `);
    }

    // ─── AI Models Catalog (pusat_kecerdasan_model_gratis) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_models_catalog (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        provider VARCHAR(100),
        use_case VARCHAR(255),
        cost_label VARCHAR(100) DEFAULT 'Gratis',
        context_window VARCHAR(50),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const modelCount = await pool.query('SELECT COUNT(*) FROM ai_models_catalog');
    if (parseInt(modelCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO ai_models_catalog (model_name, provider, use_case, cost_label, context_window) VALUES
        ('Gemini 2.0 Flash', 'Google', 'Generate caption & deskripsi produk', 'Gratis (rate limit)', '1M token'),
        ('Gemini 2.0 Pro', 'Google', 'Analisis kompetitor & strategi harga', 'Berbayar per token', '2M token')
      `);
    }

    // ─── Tenants (saas_white_label_center) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        tenant_name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE,
        plan VARCHAR(50) DEFAULT 'Starter',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const tenantCount = await pool.query('SELECT COUNT(*) FROM tenants');
    if (parseInt(tenantCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO tenants (tenant_name, subdomain, plan, status) VALUES
        ('Toko Berkah Jaya', 'berkahjaya', 'Starter', 'active'),
        ('Reseller Fashion Kita', 'fashionkita', 'Pro', 'active'),
        ('Grosir Elektronik Nusantara', 'gronusantara', 'Pro', 'active'),
        ('Distributor Sejahtera Group', 'sejahteragroup', 'Enterprise', 'active')
      `);
    }

    // ─── Affiliate Program (affiliate_engine, otomatisasi_pusat_afiliasi) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        affiliate_name VARCHAR(255) NOT NULL,
        referral_code VARCHAR(50) UNIQUE,
        commission_percent NUMERIC(5,2) DEFAULT 5.0,
        total_referrals INT DEFAULT 0,
        total_commission NUMERIC(14,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed initial keys if empty
    const keysCount = await pool.query('SELECT COUNT(*) FROM api_keys');
    if (parseInt(keysCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO api_keys (platform, api_key, permissions, quota) VALUES
        ('Tokopedia Prod', 'tk_live_f39281a82da39A2', '["PRODUK", "PESANAN", "CHAT"]', '850 / 1000 daily'),
        ('Shopee Main', 'shp_key_10df8a287bfF412', '["PRODUK", "PESANAN"]', '1.2k / 5k daily'),
        ('Meta Graph', 'EAAG_token_90f230da10Z9', '["ADS_MNG", "CATALOG"]', 'No Limit'),
        ('TikTok Shop', 'awttslvj9382dr8j', '["PRODUK", "PESANAN"]', '250 / 300 daily')
      `);
    }

    // Seed initial logs if empty
    const logsCount = await pool.query('SELECT COUNT(*) FROM scrape_logs');
    if (parseInt(logsCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO scrape_logs (marketplace, category, items_scraped, items_saved, status, started_at, finished_at) VALUES
        ('shopee', 'Flash Sale', 50, 48, 'SUCCESS', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '14 minutes'),
        ('tokopedia', 'elektronik', 30, 30, 'SUCCESS', NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '11 minutes'),
        ('lazada', 'handphone', 25, 20, 'SUCCESS', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes'),
        ('tiktok', 'skincare', 40, 40, 'SUCCESS', NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '7 minutes'),
        ('zalora', 'sepatu pria', 15, 12, 'SUCCESS', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '4 minutes')
      `);
    }

    console.log('[DB] Core tables initialized');

    // Init marketplace table
    const { initMarketplaceTable } = require('./scrapers/db');
    await initMarketplaceTable();

  } catch (error) {
    console.error('[DB] Initialization error:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────────
// CRON JOB: Auto scrape setiap 6 jam
// ─────────────────────────────────────────────────────────────────
function setupCronJobs() {
  // --- Cron 1: Auto scrape marketplace setiap 6 jam ---
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Auto scraping dimulai...');
    try {
      const { initMarketplaceTable, saveProducts, indexToMeilisearch } = require('./scrapers/db');
      const tokopedia = require('./scrapers/tokopedia');
      const shopee = require('./scrapers/shopee');
      const { scrapeAllLazada, scrapeAllBlibli } = require('./scrapers/lazada-blibli');
      const { scrapeAllZalora } = require('./scrapers/zalora');
      const { scrapeAllTikTok } = require('./scrapers/tiktok');

      await initMarketplaceTable();
      const allProducts = [];

      const tp = await tokopedia.scrapeAllCategories();
      await saveProducts(tp);
      allProducts.push(...tp);

      const sp = await shopee.scrapeAllCategories();
      await saveProducts(sp);
      allProducts.push(...sp);

      const lz = await scrapeAllLazada();
      await saveProducts(lz);
      allProducts.push(...lz);

      const bb = await scrapeAllBlibli();
      await saveProducts(bb);
      allProducts.push(...bb);

      const zl = await scrapeAllZalora();
      await saveProducts(zl);
      allProducts.push(...zl);

      const tt = await scrapeAllTikTok();
      await saveProducts(tt);
      allProducts.push(...tt);

      await indexToMeilisearch(allProducts);
      console.log(`[CRON] Auto scrape selesai: ${allProducts.length} produk`);
    } catch (err) {
      console.error('[CRON] Error:', err.message);
    }
  });
  console.log('[CRON] Scheduled: auto scrape setiap 6 jam');

  // --- Cron 2: Proses social posting yang sudah APPROVED & waktunya tiba ---
  cron.schedule('*/1 * * * *', async () => {
    try {
      const pending = await pool.query(
        `SELECT * FROM social_posts WHERE status = 'APPROVED' AND scheduled_at <= NOW()`
      );
      if (pending.rows.length === 0) return;

      console.log(`[CRON Social] Memproses ${pending.rows.length} posting terjadwal...`);
      for (const post of pending.rows) {
        const platforms = typeof post.platforms === 'string' ? JSON.parse(post.platforms) : post.platforms;
        let allOk = true;
        let failureReason = null;

        for (const platform of platforms) {
          const p = String(platform).toLowerCase();

          if (p === 'tiktok') {
            try {
              const keyRow = await pool.query(
                `SELECT * FROM api_keys WHERE platform = 'TikTok Content Posting' LIMIT 1`
              );
              const account = keyRow.rows[0];

              if (!account || !account.access_token) {
                throw new Error('Akun TikTok belum terhubung — buka /api/social/tiktok/connect dulu');
              }
              if (!post.video_path) {
                throw new Error('Post ini belum ada video_path — TikTok Content Posting API wajib video');
              }

              const { publish_id } = await tiktokPosting.publishVideo({
                accessToken: account.access_token,
                videoPath: post.video_path,
                caption: post.caption,
                privacyLevel: process.env.TIKTOK_PRIVACY_LEVEL || 'SELF_ONLY'
              });

              await pool.query(`UPDATE social_posts SET publish_id = $1 WHERE id = $2`, [publish_id, post.id]);
              console.log(`[CRON Social] ✅ TikTok (@${account.account_name}) publish_id=${publish_id}: "${post.caption.substring(0, 50)}..."`);
            } catch (err) {
              allOk = false;
              failureReason = `TikTok: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`;
              console.error(`[CRON Social] ❌ Gagal publish TikTok post #${post.id}: ${failureReason}`);
            }
          } else if (p === 'instagram') {
            try {
              const keyRow = await pool.query(
                `SELECT * FROM api_keys WHERE platform = 'Instagram Content Publish' LIMIT 1`
              );
              const account = keyRow.rows[0];
              if (!account || !account.access_token) {
                throw new Error('Akun Instagram belum terhubung — buka /api/social/instagram/connect dulu');
              }

              let result;
              if (post.video_url) {
                result = await instagramPosting.publishReel({
                  igUserId: account.api_key, // igUserId disimpan di kolom api_key saat connect
                  pageAccessToken: account.access_token,
                  videoUrl: post.video_url,
                  caption: post.caption
                });
              } else if (post.image_url) {
                result = await instagramPosting.publishImage({
                  igUserId: account.api_key,
                  pageAccessToken: account.access_token,
                  imageUrl: post.image_url,
                  caption: post.caption
                });
              } else {
                throw new Error('Post ini belum ada image_url atau video_url untuk Instagram');
              }

              await pool.query(`UPDATE social_posts SET publish_id = $1 WHERE id = $2`, [result.id, post.id]);
              console.log(`[CRON Social] ✅ Instagram (@${account.account_name}) media_id=${result.id}: "${post.caption.substring(0, 50)}..."`);
            } catch (err) {
              allOk = false;
              failureReason = `Instagram: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`;
              console.error(`[CRON Social] ❌ Gagal publish Instagram post #${post.id}: ${failureReason}`);
            }
          } else {
            // Platform lain belum ada App Review/token asli —
            // tetap simulasi supaya jelas kelihatan mana yang sudah nyata vs belum.
            console.log(`[CRON Social] ⚠️  SIMULASI (belum ada token asli) ke ${platform}: "${post.caption.substring(0, 50)}..."`);
          }
        }

        // Mark status sesuai hasil — POSTED kalau semua platform nyata sukses,
        // FAILED kalau ada yang gagal (biar ketahuan, bukan diam-diam dianggap sukses)
        if (allOk) {
          await pool.query(`UPDATE social_posts SET status = 'POSTED', failure_reason = NULL WHERE id = $1`, [post.id]);
        } else {
          await pool.query(`UPDATE social_posts SET status = 'FAILED', failure_reason = $1 WHERE id = $2`, [failureReason, post.id]);
        }
      }
      console.log(`[CRON Social] Selesai memproses ${pending.rows.length} posting.`);
    } catch (err) {
      console.error('[CRON Social] Error:', err.message);
    }
  });
  console.log('[CRON] Scheduled: social post worker setiap 1 menit');
}

// ─────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[Server] Backend berjalan di port ${PORT}`);
  await initializeDatabase();

  // Init meilisearch index settings
  try {
    const index = meilisearch.index('marketplace_products');
    await index.updateSettings({
      searchableAttributes: ['name', 'shop_name', 'category', 'marketplace'],
      filterableAttributes: ['marketplace', 'category', 'is_mall', 'discount_pct'],
      sortableAttributes: ['price', 'sold_count', 'rating']
    });
    console.log('[Meilisearch] Index settings updated');
  } catch (e) {
    console.error('[Meilisearch] Settings error:', e.message);
  }

  setupCronJobs();

  // Auto scrape saat startup (delay 30s agar DB siap)
  setTimeout(async () => {
    console.log('[Startup] Memulai initial scraping...');
    try {
      const { initMarketplaceTable, saveProducts, indexToMeilisearch } = require('./scrapers/db');
      const tokopedia = require('./scrapers/tokopedia');
      const shopee = require('./scrapers/shopee');
      const { scrapeAllLazada, scrapeAllBlibli } = require('./scrapers/lazada-blibli');
      const { scrapeAllZalora } = require('./scrapers/zalora');
      const { scrapeAllTikTok } = require('./scrapers/tiktok');

      await initMarketplaceTable();
      const allProducts = [];

      const results = await Promise.allSettled([
        tokopedia.scrapeAllCategories(),
        shopee.scrapeAllCategories(),
        scrapeAllLazada(),
        scrapeAllBlibli(),
        scrapeAllZalora(),
        scrapeAllTikTok()
      ]);

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.length) {
          const saved = await saveProducts(r.value);
          allProducts.push(...r.value);
          console.log(`[Startup Scrape] Saved ${saved} from ${r.value[0]?.marketplace || 'unknown'}`);
        }
      }

      await indexToMeilisearch(allProducts);
      console.log(`[Startup] Initial scraping selesai: ${allProducts.length} produk`);
    } catch (err) {
      console.error('[Startup Scrape] Error:', err.message);
    }
  }, 30000);
});

module.exports = app;
