/**
 * Database Seed & Marketplace Aggregator
 * Menyimpan data dari semua marketplace ke PostgreSQL + Meilisearch
 */
const { Pool } = require('pg');
const { MeiliSearch } = require('meilisearch');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@database:5432/ai_commerce'
});

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || 'http://meilisearch:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY || 'masterKey123SecureKeyForProd2026'
});

/**
 * Inisialisasi tabel marketplace_products
 */
async function initMarketplaceTable() {
  // Initialize marketplace_products, scrape_logs, scraped_products tables (existing)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketplace_products (
      id SERIAL PRIMARY KEY,
      marketplace VARCHAR(50) NOT NULL,
      external_id VARCHAR(255),
      name TEXT NOT NULL,
      price BIGINT DEFAULT 0,
      price_max BIGINT DEFAULT 0,
      original_price BIGINT DEFAULT 0,
      discount_pct INTEGER DEFAULT 0,
      image_url TEXT,
      product_url TEXT,
      rating DECIMAL(3,2) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      shop_name VARCHAR(255),
      shop_location VARCHAR(255),
      badge VARCHAR(100),
      is_mall BOOLEAN DEFAULT false,
      category VARCHAR(100),
      stock INTEGER DEFAULT 0,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(marketplace, external_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_marketplace ON marketplace_products(marketplace);
    CREATE INDEX IF NOT EXISTS idx_category ON marketplace_products(category);
    CREATE INDEX IF NOT EXISTS idx_scraped_at ON marketplace_products(scraped_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sold_count ON marketplace_products(sold_count DESC);
    CREATE INDEX IF NOT EXISTS idx_rating ON marketplace_products(rating DESC);
  `);

  // Scrape logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scrape_logs (
      id SERIAL PRIMARY KEY,
      marketplace VARCHAR(50),
      category VARCHAR(100),
      items_scraped INTEGER,
      items_saved INTEGER,
      status VARCHAR(20),
      error_msg TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP
    )
  `);

  // Raw scraped products table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scraped_products (
      id SERIAL PRIMARY KEY,
      marketplace VARCHAR(50) NOT NULL,
      external_id VARCHAR(255),
      name TEXT NOT NULL,
      price BIGINT DEFAULT 0,
      original_price BIGINT DEFAULT 0,
      discount_pct INTEGER DEFAULT 0,
      image_url TEXT,
      product_url TEXT,
      rating DECIMAL(3,2) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      shop_name VARCHAR(255),
      shop_location VARCHAR(255),
      category VARCHAR(100),
      stock INTEGER DEFAULT 0,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      raw_json JSONB,
      UNIQUE(marketplace, external_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketplace_products (
      id SERIAL PRIMARY KEY,
      marketplace VARCHAR(50) NOT NULL,
      external_id VARCHAR(255),
      name TEXT NOT NULL,
      price BIGINT DEFAULT 0,
      price_max BIGINT DEFAULT 0,
      original_price BIGINT DEFAULT 0,
      discount_pct INTEGER DEFAULT 0,
      image_url TEXT,
      product_url TEXT,
      rating DECIMAL(3,2) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      shop_name VARCHAR(255),
      shop_location VARCHAR(255),
      badge VARCHAR(100),
      is_mall BOOLEAN DEFAULT false,
      category VARCHAR(100),
      stock INTEGER DEFAULT 0,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(marketplace, external_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_marketplace ON marketplace_products(marketplace);
    CREATE INDEX IF NOT EXISTS idx_category ON marketplace_products(category);
    CREATE INDEX IF NOT EXISTS idx_scraped_at ON marketplace_products(scraped_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sold_count ON marketplace_products(sold_count DESC);
    CREATE INDEX IF NOT EXISTS idx_rating ON marketplace_products(rating DESC);
  `);

  // Tabel scrape_logs untuk tracking
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scrape_logs (
      id SERIAL PRIMARY KEY,
      marketplace VARCHAR(50),
      category VARCHAR(100),
      items_scraped INTEGER,
      items_saved INTEGER,
      status VARCHAR(20),
      error_msg TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP
    )
  `);

  // Tabel scraped_products untuk menyimpan data hasil scrape mentah
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scraped_products (
      id SERIAL PRIMARY KEY,
      marketplace VARCHAR(50) NOT NULL,
      external_id VARCHAR(255),
      name TEXT NOT NULL,
      price BIGINT DEFAULT 0,
      original_price BIGINT DEFAULT 0,
      discount_pct INTEGER DEFAULT 0,
      image_url TEXT,
      product_url TEXT,
      rating DECIMAL(3,2) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      shop_name VARCHAR(255),
      shop_location VARCHAR(255),
      category VARCHAR(100),
      stock INTEGER DEFAULT 0,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      raw_json JSONB,
      UNIQUE(marketplace, external_id)
    )
  `);

  console.log('[DB] Tables initialized');
}

// Inisialisasi tabel orders
async function initOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(255) NOT NULL,
      marketplace VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255),
      product_id VARCHAR(255),
      quantity INTEGER DEFAULT 1,
      price BIGINT,
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(order_id, marketplace)
    )
  `);
  console.log('[DB] orders table initialized');
}

// Inisialisasi tabel affiliate
async function initAffiliateTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate (
      id SERIAL PRIMARY KEY,
      affiliate_id VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      commission BIGINT DEFAULT 0,
      status VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(affiliate_id)
    )
  `);
  console.log('[DB] affiliate table initialized');
}

/**
 * Simpan produk ke database (upsert)
 */
async function saveProducts(products) {
  if (!products?.length) return 0;

  let saved = 0;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const docs = products.map((p, i) => ({
      ...p,
      id: `${p.marketplace}_${p.external_id || i}_${Date.now()}`
    }));

    for (const p of products) {
      if (!p.name || !p.marketplace) continue;

      try {
        await client.query(`
          INSERT INTO marketplace_products 
            (marketplace, external_id, name, price, price_max, original_price, discount_pct,
             image_url, product_url, rating, review_count, sold_count, shop_name,
             shop_location, badge, is_mall, category, stock, scraped_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
          ON CONFLICT (marketplace, external_id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            sold_count = EXCLUDED.sold_count,
            scraped_at = NOW()
        `, [
          p.marketplace, p.external_id || `${p.marketplace}_${Date.now()}_${Math.random()}`,
          p.name, p.price || 0, p.price_max || 0, p.original_price || 0, p.discount_pct || 0,
          p.image_url || '', p.product_url || '', p.rating || 0, p.review_count || 0,
          p.sold_count || 0, p.shop_name || '', p.shop_location || '', p.badge || '',
          p.is_mall || false, p.category || '', p.stock || 0
        ]);

        await client.query(`
          INSERT INTO scraped_products
            (marketplace, external_id, name, price, original_price, discount_pct, image_url, product_url, rating, review_count, sold_count, shop_name, shop_location, category, stock, scraped_at, raw_json)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),$16)
          ON CONFLICT (marketplace, external_id) DO UPDATE SET
            raw_json = EXCLUDED.raw_json,
            scraped_at = NOW()
        `, [
          p.marketplace, p.external_id || '', p.name, p.price || 0, p.original_price || 0,
          p.discount_pct || 0, p.image_url || '', p.product_url || '', p.rating || 0,
          p.review_count || 0, p.sold_count || 0, p.shop_name || '', p.shop_location || '',
          p.category || '', p.stock || 0, JSON.stringify(p)
        ]);

        saved++;
      } catch (e) {
        // skip duplicate atau error per item
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Save error:', err.message);
  } finally {
    client.release();
  }

  return saved;
}

/**
 * Index ke Meilisearch untuk full-text search
 */
async function indexToMeilisearch(products) {
  if (!products?.length) return;

  try {
    const index = meili.index('marketplace_products');

    await index.updateSettings({
      searchableAttributes: ['name', 'shop_name', 'category', 'marketplace'],
      filterableAttributes: ['marketplace', 'category', 'is_mall', 'discount_pct'],
      sortableAttributes: ['price', 'sold_count', 'rating', 'scraped_at'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']
    });

    // Tambahkan id untuk meilisearch
    const docs = products.map((p, i) => ({
      ...p,
      id: `${p.marketplace}_${p.external_id || i}_${Date.now()}`
    }));

    await index.addDocuments(docs, { primaryKey: 'id' });
    console.log(`[Meilisearch] Indexed ${docs.length} products`);
  } catch (err) {
    console.error('[Meilisearch] Index error:', err.message);
  }
}

module.exports = { initMarketplaceTable, initOrdersTable, initAffiliateTable, saveProducts, indexToMeilisearch, pool };
