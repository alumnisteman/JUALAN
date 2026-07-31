// backend/orders/index.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool } = require('../scrapers/db'); // reuse DB pool

// Helper to save orders to DB (upsert)
async function saveOrders(ordersArray) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const order of ordersArray) {
      const {
        order_id,
        marketplace,
        customer_name,
        product_id,
        quantity = 1,
        price,
        status = 'PENDING',
      } = order;
      await client.query(
        `INSERT INTO orders (order_id, marketplace, customer_name, product_id, quantity, price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (order_id, marketplace) DO UPDATE SET
           customer_name = EXCLUDED.customer_name,
           product_id = EXCLUDED.product_id,
           quantity = EXCLUDED.quantity,
           price = EXCLUDED.price,
           status = EXCLUDED.status,
           created_at = CURRENT_TIMESTAMP`,
        [order_id, marketplace, customer_name, product_id, quantity, price, status]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[Orders] Error saving orders:', e);
    throw e;
  } finally {
    client.release();
  }
}

// Pull orders from Shopee
async function fetchShopeeOrders() {
  const apiKey = process.env.SHOPEE_API_KEY;
  const baseUrl = process.env.SHOPEE_API_URL || 'https://api.shopee.com/v2/orders';
  if (!apiKey) {
    throw new Error('Shopee API key not configured');
  }
  const response = await axios.get(baseUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
  const raw = response.data.orders || [];
  return raw.map(o => ({
    order_id: o.order_id,
    marketplace: 'Shopee',
    customer_name: o.buyer_name,
    product_id: o.item.product_id,
    quantity: o.item.quantity,
    price: o.item.price,
    status: o.status,
  }));
}

// Pull orders from Tokopedia
async function fetchTokopediaOrders() {
  const apiKey = process.env.TOKOPEDIA_API_KEY;
  const baseUrl = process.env.TOKOPEDIA_API_URL || 'https://api.tokopedia.com/v3/orders';
  if (!apiKey) {
    throw new Error('Tokopedia API key not configured');
  }
  const response = await axios.get(baseUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
  const raw = response.data.orders || [];
  return raw.map(o => ({
    order_id: o.id,
    marketplace: 'Tokopedia',
    customer_name: o.buyer.name,
    product_id: o.product.id,
    quantity: o.quantity,
    price: o.price,
    status: o.status,
  }));
}

// POST /sync – trigger pull from enabled marketplaces (Shopee & Tokopedia by default)
router.post('/sync', async (req, res) => {
  try {
    const orders = [];
    try {
      const shopee = await fetchShopeeOrders();
      orders.push(...shopee);
    } catch (e) {
      console.warn('[Orders] Shopee fetch failed:', e.message);
    }
    try {
      const tokopedia = await fetchTokopediaOrders();
      orders.push(...tokopedia);
    } catch (e) {
      console.warn('[Orders] Tokopedia fetch failed:', e.message);
    }
    if (orders.length > 0) {
      await saveOrders(orders);
    }
    res.json({ success: true, fetched: orders.length });
  } catch (err) {
    console.error('[Orders] Sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
