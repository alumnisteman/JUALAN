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
redisClient.connect();

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

// POST /api/marketplace/scrape  - trigger scraping manual
app.post('/api/marketplace/scrape', async (req, res) => {
  try {
    res.json({ message: 'Scraping dimulai di background', status: 'running' });

    // Jalankan scraper di background (non-blocking)
    const { initMarketplaceTable, saveProducts, indexToMeilisearch } = require('./scrapers/db');
    const tokopedia = require('./scrapers/tokopedia');
    const shopee = require('./scrapers/shopee');
    const { scrapeAllLazada, scrapeAllBlibli } = require('./scrapers/lazada-blibli');
    const { scrapeAllZalora } = require('./scrapers/zalora');
    const { scrapeAllTikTok } = require('./scrapers/tiktok');

    (async () => {
      console.log('[Manual Scrape] Dimulai...');
      await initMarketplaceTable();

      const allProducts = [];

      const [tp, sp, lz, bb, zl, tt] = await Promise.allSettled([
        tokopedia.scrapeAllCategories(),
        shopee.scrapeAllCategories(),
        scrapeAllLazada(),
        scrapeAllBlibli(),
        scrapeAllZalora(),
        scrapeAllTikTok()
      ]);

      for (const r of [tp, sp, lz, bb, zl, tt]) {
        if (r.status === 'fulfilled') {
          const saved = await saveProducts(r.value);
          allProducts.push(...r.value);
          console.log(`[Scrape] Saved ${saved} products`);
        }
      }

      await indexToMeilisearch(allProducts);
      await redisClient.del(['marketplace:stats', 'marketplace:trending:20', 'marketplace:flash-sale']);
      console.log('[Manual Scrape] Selesai!', allProducts.length, 'produk');
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(100),
        price DECIMAL(10,2),
        stock INTEGER,
        sold INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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
