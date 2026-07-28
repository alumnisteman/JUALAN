/**
 * Shopee Scraper - Menggunakan Shopee Public Search API
 */
const axios = require('axios');

const SHOPEE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://shopee.co.id/',
  'If-None-Match-': '*',
  'X-API-SOURCE': 'pc',
  'X-Shopee-Language': 'id',
};

/**
 * Scrape produk Shopee via public search API
 */
async function scrapeShopeeSearch(keyword = 'elektronik', page = 0) {
  try {
    const response = await axios.get(
      'https://shopee.co.id/api/v4/search/search_items',
      {
        params: {
          by: 'relevancy',
          keyword: keyword,
          limit: 60,
          newest: page * 60,
          order: 'desc',
          page_type: 'search',
          scenario: 'PAGE_GLOBAL_SEARCH',
          version: 2
        },
        headers: SHOPEE_HEADERS,
        timeout: 10000
      }
    );

    const items = response.data?.items || [];

    return items.map(item => {
      const info = item.item_basic;
      if (!info) return null;

      const imageUrl = info.image
        ? `https://cf.shopee.co.id/file/${info.image}`
        : '';

      const price = Math.round((info.price || 0) / 100000);
      const priceMax = Math.round((info.price_max || 0) / 100000);

      return {
        marketplace: 'shopee',
        external_id: `${info.shopid}_${info.itemid}`,
        name: info.name,
        price: price,
        price_max: priceMax,
        image_url: imageUrl,
        product_url: `https://shopee.co.id/product/${info.shopid}/${info.itemid}`,
        rating: info.item_rating?.rating_star || 0,
        review_count: info.item_rating?.rating_count?.[0] || 0,
        sold_count: info.sold || 0,
        shop_name: info.shop_name || '',
        shop_location: info.shop_location || '',
        badge: info.shopee_verified ? 'Shopee Verified' : '',
        is_mall: info.is_official_shop || false,
        category: keyword,
        stock: info.stock || 0
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('[Shopee] Scrape error:', err.message);
    return [];
  }
}

/**
 * Scrape flash sale Shopee
 */
async function scrapeShopeeFlashSale() {
  try {
    const response = await axios.get(
      'https://shopee.co.id/api/v4/flash_sale/flash_sale_get_items',
      {
        params: {
          limit: 50,
          offset: 0,
          need_deals: 1
        },
        headers: SHOPEE_HEADERS,
        timeout: 10000
      }
    );

    const items = response.data?.items || [];

    return items.map(item => {
      const info = item.item_brief;
      if (!info) return null;

      const imageUrl = info.image
        ? `https://cf.shopee.co.id/file/${info.image}`
        : '';

      return {
        marketplace: 'shopee',
        external_id: `flash_${info.shopid}_${info.itemid}`,
        name: info.name,
        price: Math.round((info.price || 0) / 100000),
        original_price: Math.round((info.price_before_discount || 0) / 100000),
        discount_pct: info.raw_discount || 0,
        image_url: imageUrl,
        product_url: `https://shopee.co.id/product/${info.shopid}/${info.itemid}`,
        rating: info.item_rating?.rating_star || 0,
        sold_count: info.flash_sale_stock - (info.flash_sale_stock_sold || 0),
        shop_name: '',
        shop_location: '',
        badge: 'Flash Sale',
        category: 'flash_sale',
        stock: info.flash_sale_stock || 0
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('[Shopee Flash Sale] Scrape error:', err.message);
    return [];
  }
}

/**
 * Scrape semua kategori Shopee
 */
async function scrapeAllCategories() {
  const categories = [
    'elektronik', 'fashion wanita', 'fashion pria', 'handphone',
    'kecantikan skincare', 'makanan ringan', 'tas wanita', 'sepatu',
    'aksesoris hp', 'perlengkapan bayi'
  ];

  const results = [];

  // Flash sale dulu
  console.log('[Shopee] Scraping: Flash Sale');
  const flashItems = await scrapeShopeeFlashSale();
  results.push(...flashItems);
  await new Promise(r => setTimeout(r, 500));

  // Kategori
  for (const cat of categories) {
    console.log(`[Shopee] Scraping: ${cat}`);
    const products = await scrapeShopeeSearch(cat, 0);
    results.push(...products);
    await new Promise(r => setTimeout(r, 800));
  }

  return results;
}

module.exports = { scrapeShopeeSearch, scrapeShopeeFlashSale, scrapeAllCategories };
