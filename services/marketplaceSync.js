const axios = require('axios');
const crypto = require('crypto');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync produk ke marketplace tertentu.
 */
async function syncToMarketplace(product, platform, userId) {
  const user = await User.findById(userId);
  const integration = user.marketplaceIntegrations.find(m => m.platform === platform);

  if (!integration || !integration.isConnected) {
    throw new Error(`${platform} belum terhubung`);
  }

  switch (platform) {
    case 'shopee':   return syncToShopee(product, integration);
    case 'tokopedia': return syncToTokopedia(product, integration);
    case 'tiktok':   return syncToTikTok(product, integration);
    default:         throw new Error(`Platform tidak didukung: ${platform}`);
  }
}

/**
 * Sync data (produk atau pesanan) dari marketplace ke database lokal.
 * syncType: 'full' | 'orders' | 'inventory'
 */
async function syncMarketplace(platform, userId, syncType = 'full') {
  const user = await User.findById(userId);
  const integration = user.marketplaceIntegrations.find(m => m.platform === platform);

  if (!integration || !integration.isConnected) {
    throw new Error(`${platform} belum terhubung`);
  }

  let result;
  switch (platform) {
    case 'shopee':    result = await syncFromShopee(integration, userId, syncType); break;
    case 'tokopedia': result = await syncFromTokopedia(integration, userId, syncType); break;
    case 'tiktok':    result = await syncFromTikTok(integration, userId, syncType); break;
    default:          throw new Error(`Platform tidak didukung: ${platform}`);
  }

  integration.lastSync = new Date();
  await user.save();
  return result;
}

/**
 * Proses webhook event dari marketplace.
 */
async function handleWebhook(platform, event) {
  switch (platform) {
    case 'shopee':    return handleShopeeWebhook(event);
    case 'tokopedia': return handleTokopediaWebhook(event);
    case 'tiktok':    return handleTikTokWebhook(event);
    default:          console.warn(`Webhook platform tidak dikenal: ${platform}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPEE OPEN PLATFORM API v2
// Docs: https://open.shopee.com/documents
// Auth: HMAC-SHA256(partner_id + api_path + timestamp + access_token + shop_id)
// ─────────────────────────────────────────────────────────────────────────────

const SHOPEE_BASE = 'https://partner.shopeemobile.com/api/v2';

function shopeeSign(partnerId, partnerKey, path, timestamp, accessToken, shopId) {
  const base = `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
  return crypto.createHmac('sha256', partnerKey).update(base).digest('hex');
}

function shopeeHeaders(integration, path) {
  const partnerId = parseInt(process.env.SHOPEE_PARTNER_ID || '0');
  const partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = shopeeSign(partnerId, partnerKey, path, timestamp, integration.accessToken, parseInt(integration.shopId));

  return {
    params: {
      partner_id: partnerId,
      timestamp,
      access_token: integration.accessToken,
      shop_id: parseInt(integration.shopId),
      sign
    }
  };
}

async function shopeeRequest(method, path, integration, data = null, extraParams = {}) {
  const { params } = shopeeHeaders(integration, path);
  const url = `${SHOPEE_BASE}${path}`;

  const config = {
    method,
    url,
    params: { ...params, ...extraParams },
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) config.data = data;

  const resp = await axios(config);
  if (resp.data.error && resp.data.error !== '') {
    throw new Error(`Shopee API error: ${resp.data.error} – ${resp.data.message}`);
  }
  return resp.data.response || resp.data;
}

async function syncToShopee(product, integration) {
  if (!process.env.SHOPEE_PARTNER_ID || !process.env.SHOPEE_PARTNER_KEY) {
    console.warn('[Shopee] SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY belum dikonfigurasi');
    return { success: false, platform: 'shopee', error: 'Kredensial partner belum dikonfigurasi' };
  }

  try {
    // Cek apakah produk sudah ada di Shopee
    const existingListing = product.marketplaceListings.find(
      l => l.platform === 'shopee' && l.productId
    );

    const payload = {
      item_name: product.name,
      description: product.description || product.name,
      item_sku: product.sku,
      normal_stock: product.inventory.available,
      original_price: product.pricing.sellingPrice,
      currency: 'IDR',
      weight: product.weight || 0.5,
      condition: 'NEW',
      category_id: 100001 // default; sebaiknya dipetakan dari category produk
    };

    if (existingListing) {
      // Update produk yang sudah ada
      await shopeeRequest('POST', '/product/update_item', integration, {
        item_id: parseInt(existingListing.productId),
        ...payload
      });
      // Update harga
      await shopeeRequest('POST', '/product/update_price', integration, {
        item_list: [{
          item_id: parseInt(existingListing.productId),
          original_price: product.pricing.sellingPrice
        }]
      });
      // Update stok
      await shopeeRequest('POST', '/product/update_stock', integration, {
        item_list: [{
          item_id: parseInt(existingListing.productId),
          normal_stock: product.inventory.available
        }]
      });
      console.log(`[Shopee] Updated product ${product.sku}`);
      return { success: true, platform: 'shopee', action: 'updated', productId: existingListing.productId };
    } else {
      // Tambah produk baru
      const resp = await shopeeRequest('POST', '/product/add_item', integration, payload);
      const shopeeItemId = resp.item_id?.toString();
      console.log(`[Shopee] Added product ${product.sku} as item ${shopeeItemId}`);
      return { success: true, platform: 'shopee', action: 'created', productId: shopeeItemId };
    }
  } catch (error) {
    console.error('[Shopee] syncToShopee error:', error.message);
    return { success: false, platform: 'shopee', error: error.message };
  }
}

async function syncFromShopee(integration, userId, syncType) {
  if (!process.env.SHOPEE_PARTNER_ID || !process.env.SHOPEE_PARTNER_KEY) {
    console.warn('[Shopee] Kredensial partner belum dikonfigurasi');
    return { success: false, platform: 'shopee', ordersSynced: 0, productsSynced: 0 };
  }

  const results = { success: true, platform: 'shopee', ordersSynced: 0, productsSynced: 0, newOrders: 0 };

  try {
    if (syncType === 'full' || syncType === 'inventory') {
      // Ambil daftar produk dari Shopee
      let offset = 0;
      const pageSize = 50;
      let hasMore = true;

      while (hasMore) {
        const resp = await shopeeRequest('GET', '/product/get_item_list', integration, null, {
          offset,
          page_size: pageSize,
          item_status: 'NORMAL'
        });

        const items = resp.item || [];
        for (const item of items) {
          await upsertProductFromShopee(item, integration, userId);
          results.productsSynced++;
        }

        hasMore = resp.has_next_page && items.length === pageSize;
        offset += pageSize;
      }
    }

    if (syncType === 'full' || syncType === 'orders') {
      // Ambil pesanan baru (24 jam terakhir)
      const timeFrom = Math.floor(Date.now() / 1000) - 86400;
      const timeTo = Math.floor(Date.now() / 1000);

      const resp = await shopeeRequest('GET', '/order/get_order_list', integration, null, {
        time_range_field: 'create_time',
        time_from: timeFrom,
        time_to: timeTo,
        page_size: 50,
        order_status: 'READY_TO_SHIP'
      });

      const orderList = resp.order_list || [];
      for (const o of orderList) {
        const isNew = await upsertOrderFromShopee(o, integration, userId);
        results.ordersSynced++;
        if (isNew) results.newOrders++;
      }
    }
  } catch (error) {
    console.error('[Shopee] syncFromShopee error:', error.message);
    results.success = false;
    results.error = error.message;
  }

  return results;
}

async function upsertProductFromShopee(item, integration, userId) {
  try {
    const sku = item.item_sku || `SHOPEE-${item.item_id}`;
    const existing = await Product.findOne({ sku, createdBy: userId });

    if (existing) {
      // Update stok dan harga
      existing.inventory.quantity = item.stock_info_v2?.summary_info?.total_reserved_stock || existing.inventory.quantity;
      existing.pricing.sellingPrice = item.price_info?.[0]?.original_price || existing.pricing.sellingPrice;
      // Pastikan listing Shopee tercatat
      const listing = existing.marketplaceListings.find(l => l.platform === 'shopee');
      if (listing) {
        listing.productId = item.item_id.toString();
        listing.lastSync = new Date();
      } else {
        existing.marketplaceListings.push({
          platform: 'shopee',
          productId: item.item_id.toString(),
          shopId: integration.shopId,
          isActive: true,
          lastSync: new Date()
        });
      }
      await existing.save();
    }
    // Produk baru dari Shopee tidak dibuat otomatis di sini
    // agar menghindari duplikasi; biarkan user yang memulai dari dalam aplikasi
  } catch (err) {
    console.error('[Shopee] upsertProduct error:', err.message);
  }
}

async function upsertOrderFromShopee(orderInfo, integration, userId) {
  try {
    const marketplaceOrderId = orderInfo.order_sn;
    const existing = await Order.findOne({
      'marketplace.orderId': marketplaceOrderId,
      'marketplace.platform': 'shopee'
    });
    if (existing) return false; // sudah ada

    // Ambil detail pesanan
    let detail;
    try {
      detail = await shopeeRequest('GET', '/order/get_order_detail', integration, null, {
        order_sn_list: marketplaceOrderId
      });
      detail = detail.order_list?.[0] || orderInfo;
    } catch {
      detail = orderInfo;
    }

    const items = (detail.item_list || []).map(item => ({
      product: null, // tidak ada referensi product lokal
      sku: item.item_sku || '',
      name: item.item_name || '',
      quantity: item.model_quantity_purchased || 1,
      price: item.model_original_price || 0,
      subtotal: (item.model_original_price || 0) * (item.model_quantity_purchased || 1)
    }));

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

    await Order.create({
      orderNumber: `SHOPEE-${marketplaceOrderId}`,
      customer: {
        name: detail.recipient_address?.name || 'Shopee Customer',
        phone: detail.recipient_address?.phone || '',
        address: {
          street: detail.recipient_address?.full_address || '',
          city: detail.recipient_address?.city || '',
          province: detail.recipient_address?.state || '',
          postalCode: detail.recipient_address?.zipcode || ''
        }
      },
      items,
      marketplace: {
        platform: 'shopee',
        orderId: marketplaceOrderId,
        shopId: integration.shopId
      },
      pricing: {
        subtotal,
        shippingCost: detail.actual_shipping_fee || 0,
        total: detail.total_amount || subtotal,
        currency: 'IDR'
      },
      status: mapShopeeOrderStatus(detail.order_status),
      createdBy: userId
    });

    return true;
  } catch (err) {
    console.error('[Shopee] upsertOrder error:', err.message);
    return false;
  }
}

function mapShopeeOrderStatus(status) {
  const map = {
    UNPAID: 'pending',
    READY_TO_SHIP: 'confirmed',
    PROCESSED: 'processing',
    SHIPPED: 'shipped',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    IN_CANCEL: 'pending'
  };
  return map[status] || 'pending';
}

async function handleShopeeWebhook(event) {
  console.log('[Shopee] Webhook event:', event.code, event);
  // event.code: 3 = order status, 4 = tracking, 15 = banned
  if (event.code === 3 && event.data?.ordersn) {
    // Update order status
    const order = await Order.findOne({ 'marketplace.orderId': event.data.ordersn });
    if (order) {
      order.status = mapShopeeOrderStatus(event.data.status);
      await order.save();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKOPEDIA API (Fulfillment Service / Seller API)
// Docs: https://developer.tokopedia.com/openapi
// Auth: OAuth 2.0 – Bearer token via client_credentials / authorization_code
// ─────────────────────────────────────────────────────────────────────────────

const TOKOPEDIA_BASE = 'https://api.tokopedia.com';

async function tokopediaRequest(method, path, integration, data = null, params = {}) {
  const url = `${TOKOPEDIA_BASE}${path}`;
  const config = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      'Content-Type': 'application/json'
    },
    params
  };
  if (data) config.data = data;

  const resp = await axios(config);
  if (resp.data.header?.error_code && resp.data.header.error_code !== 0) {
    throw new Error(`Tokopedia API error ${resp.data.header.error_code}: ${resp.data.header.messages}`);
  }
  return resp.data.data || resp.data;
}

async function syncToTokopedia(product, integration) {
  if (!integration.accessToken) {
    return { success: false, platform: 'tokopedia', error: 'Access token belum dikonfigurasi' };
  }

  try {
    const existingListing = product.marketplaceListings.find(
      l => l.platform === 'tokopedia' && l.productId
    );

    if (existingListing) {
      // Update stok
      await tokopediaRequest('POST', `/v1/products/edit/price-stock`, integration, {
        data: {
          rows: [{
            product_id: parseInt(existingListing.productId),
            warehouses: [{
              warehouse_id: parseInt(integration.shopId || '0'),
              stock: product.inventory.available,
              price: product.pricing.sellingPrice
            }]
          }]
        }
      });
      console.log(`[Tokopedia] Updated stock/price for product ${product.sku}`);
      return { success: true, platform: 'tokopedia', action: 'updated', productId: existingListing.productId };
    } else {
      // Buat produk baru
      const resp = await tokopediaRequest('POST', '/v1/products/create', integration, {
        data: {
          rows: [{
            name: product.name,
            condition: 1, // baru
            description: product.description || product.name,
            price: product.pricing.sellingPrice,
            stock: product.inventory.available,
            sku: product.sku,
            weight: Math.round((product.weight || 0.5) * 1000), // gram
            category_id: 4, // default; sebaiknya dipetakan
            shop_id: parseInt(integration.shopId || '0')
          }]
        }
      });
      const productId = resp.rows?.[0]?.product_id?.toString();
      console.log(`[Tokopedia] Created product ${product.sku} as ${productId}`);
      return { success: true, platform: 'tokopedia', action: 'created', productId };
    }
  } catch (error) {
    console.error('[Tokopedia] syncToTokopedia error:', error.message);
    return { success: false, platform: 'tokopedia', error: error.message };
  }
}

async function syncFromTokopedia(integration, userId, syncType) {
  if (!integration.accessToken) {
    return { success: false, platform: 'tokopedia', ordersSynced: 0, productsSynced: 0 };
  }

  const results = { success: true, platform: 'tokopedia', ordersSynced: 0, productsSynced: 0, newOrders: 0 };

  try {
    if (syncType === 'full' || syncType === 'inventory') {
      let page = 1;
      const perPage = 50;
      let hasMore = true;

      while (hasMore) {
        const resp = await tokopediaRequest('GET', `/v1/products/page`, integration, null, {
          shop_id: integration.shopId,
          page,
          per_page: perPage
        });

        const products = resp.data || [];
        for (const p of products) {
          await upsertProductFromTokopedia(p, integration, userId);
          results.productsSynced++;
        }

        hasMore = products.length === perPage;
        page++;
      }
    }

    if (syncType === 'full' || syncType === 'orders') {
      // Ambil pesanan baru (status: 220 = Payment Verified, 400 = Order Processed)
      const resp = await tokopediaRequest('GET', '/v2/order/list', integration, null, {
        shop_id: integration.shopId,
        status: '220,400',
        page: 1,
        per_page: 50
      });

      const orders = resp.list || [];
      for (const o of orders) {
        const isNew = await upsertOrderFromTokopedia(o, integration, userId);
        results.ordersSynced++;
        if (isNew) results.newOrders++;
      }
    }
  } catch (error) {
    console.error('[Tokopedia] syncFromTokopedia error:', error.message);
    results.success = false;
    results.error = error.message;
  }

  return results;
}

async function upsertProductFromTokopedia(item, integration, userId) {
  try {
    const sku = item.sku || `TOKPED-${item.product_id}`;
    const existing = await Product.findOne({ sku, createdBy: userId });

    if (existing) {
      const listing = existing.marketplaceListings.find(l => l.platform === 'tokopedia');
      if (listing) {
        listing.productId = item.product_id.toString();
        listing.lastSync = new Date();
      } else {
        existing.marketplaceListings.push({
          platform: 'tokopedia',
          productId: item.product_id.toString(),
          shopId: integration.shopId,
          isActive: item.status === 1,
          lastSync: new Date()
        });
      }
      existing.pricing.sellingPrice = item.price || existing.pricing.sellingPrice;
      existing.inventory.quantity = item.stock || existing.inventory.quantity;
      await existing.save();
    }
  } catch (err) {
    console.error('[Tokopedia] upsertProduct error:', err.message);
  }
}

async function upsertOrderFromTokopedia(orderInfo, integration, userId) {
  try {
    const marketplaceOrderId = orderInfo.order_id?.toString();
    const existing = await Order.findOne({
      'marketplace.orderId': marketplaceOrderId,
      'marketplace.platform': 'tokopedia'
    });
    if (existing) return false;

    const items = (orderInfo.order_detail || []).map(item => ({
      product: null,
      sku: item.sku || '',
      name: item.product_name || '',
      quantity: item.quantity || 1,
      price: item.original_price || 0,
      subtotal: (item.original_price || 0) * (item.quantity || 1)
    }));

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

    await Order.create({
      orderNumber: `TOKPED-${marketplaceOrderId}`,
      customer: {
        name: orderInfo.receiver_name || 'Tokopedia Customer',
        phone: orderInfo.receiver_phone || '',
        address: {
          street: orderInfo.receiver_address || '',
          city: orderInfo.receiver_city || '',
          province: orderInfo.receiver_province || '',
          postalCode: orderInfo.receiver_postal_code || ''
        }
      },
      items,
      marketplace: {
        platform: 'tokopedia',
        orderId: marketplaceOrderId,
        shopId: integration.shopId
      },
      pricing: {
        subtotal,
        shippingCost: orderInfo.shipping_cost || 0,
        total: orderInfo.invoice_ref_num ? subtotal : (orderInfo.total_amount || subtotal),
        currency: 'IDR'
      },
      status: mapTokopediaOrderStatus(orderInfo.order_status),
      createdBy: userId
    });

    return true;
  } catch (err) {
    console.error('[Tokopedia] upsertOrder error:', err.message);
    return false;
  }
}

function mapTokopediaOrderStatus(status) {
  // Tokopedia order status codes
  const map = {
    0: 'cancelled', 5: 'cancelled', 10: 'pending', 15: 'pending',
    100: 'pending', 103: 'pending', 200: 'pending', 220: 'confirmed',
    400: 'processing', 450: 'shipped', 500: 'delivered', 600: 'completed',
    700: 'cancelled'
  };
  return map[status] || 'pending';
}

async function handleTokopediaWebhook(event) {
  console.log('[Tokopedia] Webhook event:', event);
  if (event.order_id && event.order_status !== undefined) {
    const orderId = event.order_id.toString();
    const order = await Order.findOne({ 'marketplace.orderId': orderId, 'marketplace.platform': 'tokopedia' });
    if (order) {
      order.status = mapTokopediaOrderStatus(event.order_status);
      await order.save();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIKTOK SHOP API
// Docs: https://partner.tiktokshop.com/doc
// Auth: HMAC-SHA256 signature per-request
// ─────────────────────────────────────────────────────────────────────────────

const TIKTOK_BASE = 'https://open-api.tiktokglobalshop.com';

function tiktokSign(appSecret, params, body = '') {
  // Urutkan params secara alfabet, concat, HMAC-SHA256
  const sorted = Object.keys(params)
    .filter(k => !['sign', 'access_token'].includes(k))
    .sort()
    .map(k => `${k}${params[k]}`)
    .join('');

  const str = `${appSecret}${sorted}${body}${appSecret}`;
  return crypto.createHmac('sha256', appSecret).update(str).digest('hex');
}

async function tiktokRequest(method, path, integration, data = null, extraParams = {}) {
  const appKey = process.env.TIKTOK_APP_KEY || '';
  const appSecret = process.env.TIKTOK_APP_SECRET || '';
  const timestamp = Math.floor(Date.now() / 1000);

  const params = {
    app_key: appKey,
    access_token: integration.accessToken,
    shop_id: integration.shopId,
    timestamp,
    ...extraParams
  };

  const bodyStr = data ? JSON.stringify(data) : '';
  params.sign = tiktokSign(appSecret, params, bodyStr);

  const url = `${TIKTOK_BASE}${path}`;
  const config = {
    method,
    url,
    params,
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) config.data = data;

  const resp = await axios(config);
  if (resp.data.code !== 0) {
    throw new Error(`TikTok API error ${resp.data.code}: ${resp.data.message}`);
  }
  return resp.data.data || resp.data;
}

async function syncToTikTok(product, integration) {
  if (!process.env.TIKTOK_APP_KEY || !process.env.TIKTOK_APP_SECRET) {
    return { success: false, platform: 'tiktok', error: 'APP_KEY / APP_SECRET belum dikonfigurasi' };
  }

  try {
    const existingListing = product.marketplaceListings.find(
      l => l.platform === 'tiktok' && l.productId
    );

    if (existingListing) {
      // Update stok dan harga
      await tiktokRequest('POST', '/api/products/stocks', integration, {
        product_id: existingListing.productId,
        skus: [{
          id: existingListing.platformSpecificData?.skuId,
          stock_infos: [{ available_stock: product.inventory.available }]
        }]
      });
      await tiktokRequest('POST', '/api/products/prices', integration, {
        product_id: existingListing.productId,
        skus: [{
          id: existingListing.platformSpecificData?.skuId,
          original_price: product.pricing.sellingPrice.toString()
        }]
      });
      console.log(`[TikTok] Updated product ${product.sku}`);
      return { success: true, platform: 'tiktok', action: 'updated', productId: existingListing.productId };
    } else {
      // Buat produk baru
      const resp = await tiktokRequest('POST', '/api/products', integration, {
        product_name: product.name,
        description: product.description || product.name,
        skus: [{
          seller_sku: product.sku,
          original_price: product.pricing.sellingPrice.toString(),
          stock_infos: [{ available_stock: product.inventory.available }]
        }],
        weight: { value: (product.weight || 0.5).toString(), unit: 'KILOGRAM' },
        category_id: '601974'  // default; perlu dipetakan
      });

      const productId = resp.product_id;
      console.log(`[TikTok] Created product ${product.sku} as ${productId}`);
      return { success: true, platform: 'tiktok', action: 'created', productId };
    }
  } catch (error) {
    console.error('[TikTok] syncToTikTok error:', error.message);
    return { success: false, platform: 'tiktok', error: error.message };
  }
}

async function syncFromTikTok(integration, userId, syncType) {
  if (!process.env.TIKTOK_APP_KEY || !process.env.TIKTOK_APP_SECRET) {
    return { success: false, platform: 'tiktok', ordersSynced: 0, productsSynced: 0 };
  }

  const results = { success: true, platform: 'tiktok', ordersSynced: 0, productsSynced: 0, newOrders: 0 };

  try {
    if (syncType === 'full' || syncType === 'inventory') {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const resp = await tiktokRequest('GET', '/api/products', integration, null, {
          page_number: page,
          page_size: 50
        });

        const products = resp.products || [];
        for (const p of products) {
          await upsertProductFromTikTok(p, integration, userId);
          results.productsSynced++;
        }

        hasMore = products.length === 50;
        page++;
      }
    }

    if (syncType === 'full' || syncType === 'orders') {
      const now = Math.floor(Date.now() / 1000);
      const resp = await tiktokRequest('GET', '/api/orders', integration, null, {
        create_time_from: now - 86400,
        create_time_to: now,
        order_status: 'AWAITING_SHIPMENT',
        page_size: 50
      });

      const orders = resp.orders || [];
      for (const o of orders) {
        const isNew = await upsertOrderFromTikTok(o, integration, userId);
        results.ordersSynced++;
        if (isNew) results.newOrders++;
      }
    }
  } catch (error) {
    console.error('[TikTok] syncFromTikTok error:', error.message);
    results.success = false;
    results.error = error.message;
  }

  return results;
}

async function upsertProductFromTikTok(item, integration, userId) {
  try {
    const sku = item.skus?.[0]?.seller_sku || `TIKTOK-${item.product_id}`;
    const existing = await Product.findOne({ sku, createdBy: userId });

    if (existing) {
      const listing = existing.marketplaceListings.find(l => l.platform === 'tiktok');
      if (listing) {
        listing.productId = item.product_id;
        listing.lastSync = new Date();
        listing.platformSpecificData = { skuId: item.skus?.[0]?.id };
      } else {
        existing.marketplaceListings.push({
          platform: 'tiktok',
          productId: item.product_id,
          shopId: integration.shopId,
          isActive: item.status === 'ACTIVATE',
          lastSync: new Date(),
          platformSpecificData: { skuId: item.skus?.[0]?.id }
        });
      }
      const price = parseFloat(item.skus?.[0]?.original_price || '0');
      const stock = item.skus?.[0]?.stock_infos?.reduce((s, si) => s + (si.available_stock || 0), 0) || 0;
      if (price) existing.pricing.sellingPrice = price;
      if (stock) existing.inventory.quantity = stock;
      await existing.save();
    }
  } catch (err) {
    console.error('[TikTok] upsertProduct error:', err.message);
  }
}

async function upsertOrderFromTikTok(orderInfo, integration, userId) {
  try {
    const marketplaceOrderId = orderInfo.id || orderInfo.order_id;
    const existing = await Order.findOne({
      'marketplace.orderId': marketplaceOrderId,
      'marketplace.platform': 'tiktok'
    });
    if (existing) return false;

    const items = (orderInfo.line_items || []).map(item => ({
      product: null,
      sku: item.seller_sku || '',
      name: item.product_name || '',
      quantity: item.quantity || 1,
      price: parseFloat(item.sale_price || '0'),
      subtotal: parseFloat(item.sale_price || '0') * (item.quantity || 1)
    }));

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

    await Order.create({
      orderNumber: `TIKTOK-${marketplaceOrderId}`,
      customer: {
        name: orderInfo.recipient_address?.name || 'TikTok Customer',
        phone: orderInfo.recipient_address?.phone_number || '',
        address: {
          street: orderInfo.recipient_address?.full_address || '',
          city: orderInfo.recipient_address?.city || '',
          province: orderInfo.recipient_address?.state || '',
          postalCode: orderInfo.recipient_address?.zipcode || ''
        }
      },
      items,
      marketplace: {
        platform: 'tiktok',
        orderId: marketplaceOrderId,
        shopId: integration.shopId
      },
      pricing: {
        subtotal,
        shippingCost: parseFloat(orderInfo.shipping_fee || '0'),
        total: parseFloat(orderInfo.payment?.total_amount || subtotal),
        currency: 'IDR'
      },
      status: mapTikTokOrderStatus(orderInfo.status),
      createdBy: userId
    });

    return true;
  } catch (err) {
    console.error('[TikTok] upsertOrder error:', err.message);
    return false;
  }
}

function mapTikTokOrderStatus(status) {
  const map = {
    UNPAID: 'pending',
    ON_HOLD: 'pending',
    AWAITING_SHIPMENT: 'confirmed',
    AWAITING_COLLECTION: 'processing',
    IN_TRANSIT: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };
  return map[status] || 'pending';
}

async function handleTikTokWebhook(event) {
  console.log('[TikTok] Webhook event type:', event.type);
  if (event.type === 'ORDER_STATUS_CHANGE' && event.data?.order_id) {
    const orderId = event.data.order_id.toString();
    const order = await Order.findOne({ 'marketplace.orderId': orderId, 'marketplace.platform': 'tiktok' });
    if (order) {
      order.status = mapTikTokOrderStatus(event.data.status);
      await order.save();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  syncToMarketplace,
  syncMarketplace,
  handleWebhook
};
