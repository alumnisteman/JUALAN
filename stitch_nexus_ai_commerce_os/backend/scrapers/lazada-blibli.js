/**
 * Lazada & Blibli Scraper - menggunakan public API/feed mereka
 */
const { getAxiosClient } = require('./proxy');
const axios = getAxiosClient();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
};

/* ============================================================
   LAZADA SCRAPER
   Menggunakan Lazada public feed/search API
   ============================================================ */

async function scrapeLazada(keyword = 'elektronik', page = 1) {
  try {
    const response = await axios.get(
      'https://www.lazada.co.id/catalog/',
      {
        params: {
          q: keyword,
          _keyori: 'ss',
          from: 'input',
          spm: 'a2o4l.searchbar',
          ajax: true,
          page: page
        },
        headers: {
          ...HEADERS,
          'Referer': 'https://www.lazada.co.id/',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 10000
      }
    );

    const items = response.data?.mods?.listItems || [];

    return items.map(item => ({
      marketplace: 'lazada',
      external_id: String(item.itemId || item.nid || ''),
      name: item.name || '',
      price: parseInt(String(item.price || '0').replace(/[^\d]/g, '')) || 0,
      original_price: parseInt(String(item.originalPrice || '0').replace(/[^\d]/g, '')) || 0,
      discount_pct: parseInt(item.discount || '0') || 0,
      image_url: item.image || '',
      product_url: item.itemUrl ? `https:${item.itemUrl}` : '',
      rating: parseFloat(item.ratingScore || 0),
      review_count: parseInt(item.review || 0),
      sold_count: 0,
      shop_name: item.sellerName || '',
      shop_location: '',
      badge: item.badgeList?.[0]?.text || '',
      is_mall: item.sellerName?.includes('Official') || false,
      category: keyword
    }));
  } catch (err) {
    console.error('[Lazada] Scrape error:', err.message);
    return [];
  }
}

async function scrapeAllLazada() {
  const categories = [
    'handphone', 'laptop', 'fashion wanita', 'fashion pria',
    'kecantikan', 'peralatan rumah', 'olahraga', 'mainan anak'
  ];

  const results = [];
  for (const cat of categories) {
    console.log(`[Lazada] Scraping: ${cat}`);
    const products = await scrapeLazada(cat, 1);
    results.push(...products);
    await new Promise(r => setTimeout(r, 900));
  }
  return results;
}

/* ============================================================
   BLIBLI SCRAPER
   Menggunakan Blibli public product API
   ============================================================ */

async function scrapeBlibli(keyword = 'elektronik', page = 1) {
  try {
    const response = await axios.get(
      'https://www.blibli.com/backend/search/products',
      {
        params: {
          searchTerm: keyword,
          page: page - 1,
          start: (page - 1) * 40,
          itemPerPage: 40,
          sort: '5' // sort by best seller
        },
        headers: {
          ...HEADERS,
          'Referer': 'https://www.blibli.com/',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    const products = response.data?.data?.products || [];

    return products.map(p => ({
      marketplace: 'blibli',
      external_id: p.id || '',
      name: p.name || '',
      price: parseInt(p.price?.offerPrice || 0),
      original_price: parseInt(p.price?.idPrice || 0),
      discount_pct: parseInt(p.price?.discountPercentage || 0),
      image_url: p.images?.[0]?.thumbnail || '',
      product_url: p.url ? `https://www.blibli.com${p.url}` : '',
      rating: parseFloat(p.review?.rating || 0),
      review_count: parseInt(p.review?.count || 0),
      sold_count: 0,
      shop_name: p.merchant?.name || '',
      shop_location: p.merchant?.location || '',
      badge: p.badge?.text || '',
      is_mall: p.merchant?.official || false,
      category: keyword
    }));
  } catch (err) {
    console.error('[Blibli] Scrape error:', err.message);
    return [];
  }
}

async function scrapeAllBlibli() {
  const categories = [
    'handphone', 'laptop', 'fashion', 'kecantikan',
    'elektronik', 'perabot', 'olahraga', 'otomotif'
  ];

  const results = [];
  for (const cat of categories) {
    console.log(`[Blibli] Scraping: ${cat}`);
    const products = await scrapeBlibli(cat, 1);
    results.push(...products);
    await new Promise(r => setTimeout(r, 900));
  }
  return results;
}

module.exports = {
  scrapeLazada, scrapeAllLazada,
  scrapeBlibli, scrapeAllBlibli
};
