/**
 * TikTok Shop Scraper - Dual Mode
 * Mode 1 (Preferred): TikTok Shop Open API (menggunakan Client Key + Secret)
 * Mode 2 (Fallback) : Cheerio + ScraperAPI SSR (scraping HTML)
 *
 * Dokumentasi API: https://partner.tiktokshop.com/docv2
 */
const crypto = require('crypto');
const { getAxiosClient } = require('./proxy');
const cheerio = require('cheerio');
const axiosProxy = getAxiosClient();
const axios = require('axios');

// ─── TikTok Shop Open API Config ────────────────────────────────
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';
const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com';

/**
 * Generate HMAC-SHA256 signature sesuai TikTok Shop Open API spec.
 * Ref: https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9
 */
function generateSignature(path, params, body = '') {
  // 1. Sort params by key (alphabetical)
  const sortedKeys = Object.keys(params).sort();
  const baseString = sortedKeys.map(k => `${k}${params[k]}`).join('');

  // 2. Concat: secret + path + sorted params + body + secret
  const signString = TIKTOK_CLIENT_SECRET + path + baseString + body + TIKTOK_CLIENT_SECRET;

  // 3. HMAC-SHA256
  return crypto.createHmac('sha256', TIKTOK_CLIENT_SECRET)
    .update(signString)
    .digest('hex');
}

/**
 * Get access token using client credentials (app-level token).
 * Endpoint: /api/v2/token/get
 */
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.get(`${TIKTOK_API_BASE}/api/v2/token/get`, {
      params: {
        app_key: TIKTOK_CLIENT_KEY,
        app_secret: TIKTOK_CLIENT_SECRET,
        grant_type: 'authorized_code',
      },
      timeout: 15000
    });

    const data = response.data;
    if (data.code === 0 && data.data && data.data.access_token) {
      cachedToken = data.data.access_token;
      // Set expiry 1 hour before actual expiry for safety
      tokenExpiry = Date.now() + (data.data.expire_in - 3600) * 1000;
      console.log('[TikTok API] Access token obtained successfully');
      return cachedToken;
    } else {
      console.warn('[TikTok API] Token response:', data.message || JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.warn('[TikTok API] Token error:', err.message);
    return null;
  }
}

/**
 * Call TikTok Shop Open API endpoint with proper signature.
 */
async function callTikTokAPI(path, queryParams = {}, method = 'GET', body = null) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const params = {
    app_key: TIKTOK_CLIENT_KEY,
    timestamp: String(timestamp),
    ...queryParams
  };

  const token = await getAccessToken();
  if (token) {
    params.access_token = token;
  }

  const bodyStr = body ? JSON.stringify(body) : '';
  const sign = generateSignature(path, params, bodyStr);
  params.sign = sign;

  const config = {
    method,
    url: `${TIKTOK_API_BASE}${path}`,
    params,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'x-tts-access-token': token || ''
    }
  };

  if (body && method !== 'GET') {
    config.data = body;
  }

  const response = await axios(config);
  return response.data;
}

/**
 * Search produk via TikTok Shop Open API.
 * Endpoint: /api/products/search (v202309)
 */
async function searchProductsAPI(keyword = 'skincare') {
  try {
    const result = await callTikTokAPI(
      '/api/products/search',
      { page_size: '50' },
      'POST',
      { search_keyword: keyword }
    );

    if (result.code !== 0 || !result.data || !result.data.products) {
      console.warn(`[TikTok API] Search "${keyword}":`, result.message || 'No products');
      return [];
    }

    return result.data.products.map(p => ({
      marketplace: 'tiktok',
      external_id: p.id || '',
      name: p.title || p.name || '',
      price: parseInt(String(p.sale_price?.amount || p.price || 0).replace(/[^\d]/g, '')) || 0,
      original_price: parseInt(String(p.original_price?.amount || 0).replace(/[^\d]/g, '')) || 0,
      image_url: (p.images && p.images[0]?.url) || p.main_image?.url || '',
      product_url: `https://www.tiktok.com/view/product/${p.id}`,
      rating: parseFloat(p.star_rating || p.rating || 0),
      sold_count: parseInt(String(p.sold_count || p.sales || 0).replace(/[^\d]/g, '')) || 0,
      shop_name: p.shop_name || '',
      is_mall: p.is_official || false,
      category: keyword,
      discount_pct: 0,
      review_count: parseInt(p.review_count || 0)
    }));
  } catch (err) {
    console.warn(`[TikTok API] Search error for "${keyword}":`, err.message);
    return [];
  }
}

/**
 * Fallback: Scraping HTML via ScraperAPI/Cheerio (mode lama).
 */
async function scrapeTikTokShop(keyword = 'skincare') {
  try {
    const response = await axiosProxy.get('https://www.tiktok.com/search/shop', {
      params: {
        q: keyword,
        render: 'true' // Memberitahu ScraperAPI untuk mengeksekusi Javascript (Headless Chrome)
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000 // Render butuh waktu lebih lama
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Karena class TikTok sering berubah, kita ambil dari JSON state jika ada, 
    // atau fallback ke tag HTML umum
    const nextData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    if (nextData) {
      try {
        const jsonData = JSON.parse(nextData);
        // Parsing struktur internal TikTok JSON (Struktur ini bisa berubah-ubah)
        const products = jsonData?.__DEFAULT_SCOPE__?.['webapp.shop']?.searchResults || [];
        
        products.forEach(p => {
          results.push({
            marketplace: 'tiktok',
            external_id: p.productId || '',
            name: p.title || '',
            price: parseInt(String(p.price).replace(/[^\d]/g, '')) || 0,
            original_price: parseInt(String(p.originalPrice).replace(/[^\d]/g, '')) || 0,
            image_url: p.imageUrl || '',
            product_url: p.productUrl || '',
            rating: parseFloat(p.rating) || 0,
            sold_count: parseInt(String(p.soldCount).replace(/[^\d]/g, '')) || 0,
            shop_name: p.shopName || '',
            is_mall: p.isOfficial || false,
            category: keyword
          });
        });

        if (results.length > 0) return results;
      } catch (e) {
        console.log('[TikTok] Failed to parse JSON state, falling back to HTML parsing');
      }
    }

    // Fallback: Parsing elemen HTML
    $('[data-e2e="search-shop-item"]').each((i, el) => {
      const name = $(el).find('h3, .product-title').first().text().trim();
      const priceText = $(el).find('.price, [data-e2e="product-price"]').first().text().trim();
      const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
      const imageUrl = $(el).find('img').first().attr('src') || '';
      const link = $(el).find('a').first().attr('href') || '';
      const shopName = $(el).find('.shop-name, [data-e2e="shop-name"]').first().text().trim();
      const soldText = $(el).find('.sold-count').first().text().trim();
      const sold = parseInt(soldText.replace(/[^\d]/g, '')) || 0;

      if (name && price) {
        results.push({
          marketplace: 'tiktok',
          external_id: `tt_${Date.now()}_${i}`,
          name,
          price,
          image_url: imageUrl,
          product_url: link.startsWith('http') ? link : `https://www.tiktok.com${link}`,
          shop_name: shopName,
          sold_count: sold,
          category: keyword
        });
      }
    });

    return results;
  } catch (err) {
    console.error('[TikTok] Scrape error:', err.message);
    return [];
  }
}

/**
 * Master function: gunakan API jika credentials tersedia, fallback ke scraping.
 */
async function scrapeAllTikTok() {
  const categories = [
    'skincare viral', 'makeup tiktok', 'baju ootd', 'racun tiktok',
    'aksesoris hp', 'makanan ringan', 'parfum'
  ];

  const useAPI = TIKTOK_CLIENT_KEY && TIKTOK_CLIENT_SECRET;
  if (useAPI) {
    console.log('[TikTok] ✅ Using Official TikTok Shop Open API (Client Key detected)');
  } else {
    console.log('[TikTok] ⚠️ No API credentials, falling back to HTML scraping');
  }

  const results = [];
  for (const cat of categories) {
    console.log(`[TikTok] Scraping: ${cat}`);
    const products = useAPI
      ? await searchProductsAPI(cat)
      : await scrapeTikTokShop(cat);
    results.push(...products);
    // Delay: API lebih cepat tapi tetap hormati rate limit
    await new Promise(r => setTimeout(r, useAPI ? 1000 : 2000));
  }

  console.log(`[TikTok] Total: ${results.length} produk ditemukan`);
  return results;
}

module.exports = { scrapeTikTokShop, scrapeAllTikTok, searchProductsAPI };
