const axios = require('axios');

/**
 * Membuat instance Axios yang otomatis merutekan traffic
 * melalui ScraperAPI jika API key tersedia di Environment.
 */
function getAxiosClient() {
  const apiKey = process.env.SCRAPER_API_KEY;
  const client = axios.create();

  if (apiKey) {
    client.interceptors.request.use((config) => {
      // 1. Ambil URL asli
      let fullUrl = config.url || '';
      
      // 2. Gabungkan query params (jika ada) ke dalam URL
      if (config.params) {
        const urlParams = new URLSearchParams(config.params).toString();
        if (urlParams) {
          fullUrl = fullUrl.includes('?') ? `${fullUrl}&${urlParams}` : `${fullUrl}?${urlParams}`;
        }
        config.params = {}; // Kosongkan agar axios tidak menyematkan lagi
      }

      // 3. Ubah tujuan request ke ScraperAPI
      config.url = 'http://api.scraperapi.com/';
      
      // 4. Set parameter khusus untuk ScraperAPI
      config.params = {
        api_key: apiKey,
        url: fullUrl,
        keep_headers: 'true' // Teruskan Header (seperti referer, dll) ke target
      };
      
      return config;
    });
  }
  
  return client;
}

module.exports = { getAxiosClient };
