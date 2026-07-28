/**
 * Marketplace Scraper Runner
 * Jalankan scraping dari semua marketplace & simpan ke database
 */
require('dotenv').config();

const tokopedia = require('./tokopedia');
const shopee = require('./shopee');
const { scrapeAllLazada, scrapeAllBlibli } = require('./lazada-blibli');
const { scrapeAllZalora } = require('./zalora');
const { scrapeAllTikTok } = require('./tiktok');
const { initMarketplaceTable, saveProducts, indexToMeilisearch } = require('./db');

async function runAllScrapers() {
  console.log('='.repeat(60));
  console.log('[Scraper] Mulai scraping semua marketplace...');
  console.log(`[Scraper] Waktu: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  await initMarketplaceTable();

  const allProducts = [];
  const stats = {};

  // ─── TOKOPEDIA ───────────────────────────────────────────
  try {
    console.log('\n[1/6] Scraping Tokopedia...');
    const products = await tokopedia.scrapeAllCategories();
    const saved = await saveProducts(products);
    stats.tokopedia = { scraped: products.length, saved };
    allProducts.push(...products);
    console.log(`[Tokopedia] ✓ Scraped: ${products.length}, Saved: ${saved}`);
  } catch (err) {
    stats.tokopedia = { error: err.message };
    console.error('[Tokopedia] ✗ Error:', err.message);
  }

  // ─── SHOPEE ──────────────────────────────────────────────
  try {
    console.log('\n[2/6] Scraping Shopee...');
    const products = await shopee.scrapeAllCategories();
    const saved = await saveProducts(products);
    stats.shopee = { scraped: products.length, saved };
    allProducts.push(...products);
    console.log(`[Shopee] ✓ Scraped: ${products.length}, Saved: ${saved}`);
  } catch (err) {
    stats.shopee = { error: err.message };
    console.error('[Shopee] ✗ Error:', err.message);
  }

  // ─── LAZADA ──────────────────────────────────────────────
  try {
    console.log('\n[3/6] Scraping Lazada...');
    const products = await scrapeAllLazada();
    const saved = await saveProducts(products);
    stats.lazada = { scraped: products.length, saved };
    allProducts.push(...products);
    console.log(`[Lazada] ✓ Scraped: ${products.length}, Saved: ${saved}`);
  } catch (err) {
    stats.lazada = { error: err.message };
    console.error('[Lazada] ✗ Error:', err.message);
  }

  // ─── BLIBLI ──────────────────────────────────────────────
  try {
    console.log('\n[4/6] Scraping Blibli...');
    const products = await scrapeAllBlibli();
    const saved = await saveProducts(products);
    stats.blibli = { scraped: products.length, saved };
    allProducts.push(...products);
    console.log(`[Blibli] ✓ Scraped: ${products.length}, Saved: ${saved}`);
  } catch (err) {
    stats.blibli = { error: err.message };
    console.error('[Blibli] ✗ Error:', err.message);
  }

  // ─── ZALORA ──────────────────────────────────────────────
  try {
    console.log('\n[5/6] Scraping Zalora...');
    const products = await scrapeAllZalora();
    const saved = await saveProducts(products);
    stats.zalora = { scraped: products.length, saved };
    allProducts.push(...products);
    console.log(`[Zalora] ✓ Scraped: ${products.length}, Saved: ${saved}`);
  } catch (err) {
    stats.zalora = { error: err.message };
    console.error('[Zalora] ✗ Error:', err.message);
  }

  // ─── TIKTOK SHOP ─────────────────────────────────────────
  try {
    console.log('\n[6/6] Scraping TikTok Shop...');
    const products = await scrapeAllTikTok();
    const saved = await saveProducts(products);
    stats.tiktok = { scraped: products.length, saved };
    allProducts.push(...products);
    console.log(`[TikTok] ✓ Scraped: ${products.length}, Saved: ${saved}`);
  } catch (err) {
    stats.tiktok = { error: err.message };
    console.error('[TikTok] ✗ Error:', err.message);
  }

  // ─── INDEX KE MEILISEARCH ────────────────────────────────
  console.log('\n[5/5] Indexing ke Meilisearch...');
  await indexToMeilisearch(allProducts);

  // ─── RINGKASAN ───────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('[Scraper] RINGKASAN HASIL SCRAPING');
  console.log('='.repeat(60));
  Object.entries(stats).forEach(([marketplace, stat]) => {
    if (stat.error) {
      console.log(`  ${marketplace}: ✗ ERROR - ${stat.error}`);
    } else {
      console.log(`  ${marketplace}: ✓ ${stat.scraped} scraped, ${stat.saved} saved`);
    }
  });
  console.log(`  TOTAL: ${allProducts.length} produk dari semua marketplace`);
  console.log('='.repeat(60));

  process.exit(0);
}

runAllScrapers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
