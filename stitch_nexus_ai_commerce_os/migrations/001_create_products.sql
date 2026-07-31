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
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace ON marketplace_products(marketplace);
CREATE INDEX IF NOT EXISTS idx_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_scraped_at ON marketplace_products(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_sold_count ON marketplace_products(sold_count DESC);
CREATE INDEX IF NOT EXISTS idx_rating ON marketplace_products(rating DESC);
