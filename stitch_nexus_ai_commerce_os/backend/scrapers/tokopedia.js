/**
 * Tokopedia Scraper - Menggunakan Tokopedia Public GraphQL API
 */
const { getAxiosClient } = require('./proxy');
const axios = getAxiosClient();

const TOKOPEDIA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Source': 'tokopedia-lite',
  'tkpd-userid': '0',
  'Referer': 'https://www.tokopedia.com/',
  'Origin': 'https://www.tokopedia.com'
};

/**
 * Scrape produk trending Tokopedia via GraphQL API
 */
async function scrapeTokopediaPopular(keyword = 'elektronik', page = 1) {
  try {
    const query = `
      query SearchProductQueryV4($params: String) {
        ace_search_product_v4(params: $params) {
          data {
            products {
              id
              name
              price
              imageUrl
              url
              rating
              reviewCount
              sold
              shop {
                name
                city
              }
              badges {
                title
              }
            }
          }
        }
      }
    `;

    const params = `page=${page}&q=${encodeURIComponent(keyword)}&rows=40&start=${(page - 1) * 40}&device=desktop&source=search`;

    const response = await axios.post(
      'https://gql.tokopedia.com/',
      JSON.stringify([{
        operationName: 'SearchProductQueryV4',
        variables: { params },
        query
      }]),
      {
        headers: TOKOPEDIA_HEADERS,
        timeout: 10000
      }
    );

    const products = response.data?.[0]?.data?.ace_search_product_v4?.data?.products || [];

    return products.map(p => ({
      marketplace: 'tokopedia',
      external_id: String(p.id),
      name: p.name,
      price: parseInt(String(p.price).replace(/[^\d]/g, '')) || 0,
      image_url: p.imageUrl,
      product_url: p.url,
      rating: parseFloat(p.rating) || 0,
      review_count: parseInt(p.reviewCount) || 0,
      sold_count: parseInt(String(p.sold).replace(/[^\d]/g, '')) || 0,
      shop_name: p.shop?.name || '',
      shop_location: p.shop?.city || '',
      badge: p.badges?.[0]?.title || '',
      category: keyword
    }));
  } catch (err) {
    console.error('[Tokopedia] Scrape error:', err.message);
    return [];
  }
}

/**
 * Scrape beberapa kategori sekaligus
 */
async function scrapeAllCategories() {
  const categories = [
    'elektronik', 'fashion pria', 'fashion wanita', 'handphone',
    'kecantikan', 'makanan minuman', 'olahraga', 'otomotif',
    'perabot rumah', 'komputer laptop'
  ];

  const results = [];
  for (const cat of categories) {
    console.log(`[Tokopedia] Scraping: ${cat}`);
    const products = await scrapeTokopediaPopular(cat, 1);
    results.push(...products);
    await new Promise(r => setTimeout(r, 800)); // rate limit
  }
  return results;
}

module.exports = { scrapeTokopediaPopular, scrapeAllCategories };
