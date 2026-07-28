const express = require('express');
const { Pool } = require('pg');
const { MeiliSearch } = require('meilisearch');
const redis = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

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

    (async () => {
      console.log('[Manual Scrape] Dimulai...');
      await initMarketplaceTable();

      const allProducts = [];

      const [tp, sp, lz, bb] = await Promise.allSettled([
        tokopedia.scrapeAllCategories(),
        shopee.scrapeAllCategories(),
        scrapeAllLazada(),
        scrapeAllBlibli()
      ]);

      for (const r of [tp, sp, lz, bb]) {
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
// EXISTING ENDPOINTS (orders, products internal DB)
// ─────────────────────────────────────────────────────────────────
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

      await initMarketplaceTable();
      const allProducts = [];

      const tp = await tokopedia.scrapeAllCategories();
      await saveProducts(tp);
      allProducts.push(...tp);

      const sp = await shopee.scrapeAllCategories();
      await saveProducts(sp);
      allProducts.push(...sp);

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

      await initMarketplaceTable();
      const allProducts = [];

      const results = await Promise.allSettled([
        tokopedia.scrapeAllCategories(),
        shopee.scrapeAllCategories(),
        scrapeAllLazada(),
        scrapeAllBlibli()
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
