/**
 * Zalora Scraper - Menggunakan public catalog API Zalora
 */
const { getAxiosClient } = require('./proxy');
const axios = getAxiosClient();

async function scrapeZalora(keyword = 'fashion', page = 1) {
  try {
    const response = await axios.get('https://www.zalora.co.id/_c/v1/desktop/list_catalog_full', {
      params: {
        search: keyword,
        limit: 40,
        offset: (page - 1) * 40,
        sort: 'popularity',
        dir: 'desc'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 15000
    });

    const items = response.data?.response?.docs || [];

    return items.map(p => {
      const price = parseInt(p.meta?.price) || 0;
      const specialPrice = parseInt(p.meta?.special_price) || price;
      const discount = price > specialPrice ? Math.round(((price - specialPrice) / price) * 100) : 0;

      return {
        marketplace: 'zalora',
        external_id: String(p.meta?.sku || p.id_product),
        name: p.meta?.name || '',
        price: specialPrice,
        original_price: price,
        discount_pct: discount,
        image_url: p.meta?.image || '',
        product_url: p.meta?.link ? `https://www.zalora.co.id/${p.meta.link}` : '',
        rating: 4.5, // Zalora tidak expose rating di list ini
        review_count: 0,
        sold_count: 0,
        shop_name: p.meta?.brand || 'Zalora',
        shop_location: 'Jakarta',
        badge: 'Zalora Mall',
        is_mall: true, // Semua barang Zalora dianggap terverifikasi
        category: keyword
      };
    });
  } catch (err) {
    console.error('[Zalora] Scrape error:', err.message);
    return [];
  }
}

async function scrapeAllZalora() {
  const categories = [
    'sepatu pria', 'sepatu wanita', 'tas wanita', 'jam tangan pria',
    'baju muslim', 'pakaian olahraga', 'perawatan wajah', 'make up'
  ];

  const results = [];
  for (const cat of categories) {
    console.log(`[Zalora] Scraping: ${cat}`);
    const products = await scrapeZalora(cat, 1);
    results.push(...products);
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

module.exports = { scrapeZalora, scrapeAllZalora };
