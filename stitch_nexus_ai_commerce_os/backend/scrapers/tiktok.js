/**
 * TikTok Shop Scraper - Menggunakan Cheerio + ScraperAPI SSR
 */
const { getAxiosClient } = require('./proxy');
const cheerio = require('cheerio');
const axios = getAxiosClient();

async function scrapeTikTokShop(keyword = 'skincare') {
  try {
    const response = await axios.get('https://www.tiktok.com/search/shop', {
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

async function scrapeAllTikTok() {
  const categories = [
    'skincare viral', 'makeup tiktok', 'baju ootd', 'racun tiktok',
    'aksesoris hp', 'makanan ringan', 'parfum'
  ];

  const results = [];
  for (const cat of categories) {
    console.log(`[TikTok] Scraping: ${cat}`);
    const products = await scrapeTikTokShop(cat);
    results.push(...products);
    await new Promise(r => setTimeout(r, 2000)); // Delay lebih lama untuk TikTok
  }
  return results;
}

module.exports = { scrapeTikTokShop, scrapeAllTikTok };
