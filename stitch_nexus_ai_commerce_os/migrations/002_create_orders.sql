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
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_marketplace ON orders(marketplace);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
