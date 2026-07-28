/**
 * API Connector - Menghubungkan frontend modul ke Backend API
 * Digunakan oleh: Intelligence Hub, Manajemen Pesanan, Analitik Eksekutif
 */
const API = {
  BASE_URL: window.location.port === '' 
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : `${window.location.protocol}//${window.location.hostname}:3000`,

  async fetch(endpoint) {
    try {
      const res = await fetch(`${this.BASE_URL}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[API] Error fetching ${endpoint}:`, err.message);
      return null;
    }
  },

  // ─── Marketplace Stats ──────────────────────────────────────────
  async getStats() {
    return await this.fetch('/api/marketplace/stats');
  },

  // ─── Trending Products ──────────────────────────────────────────
  async getTrending(limit = 20) {
    return await this.fetch(`/api/marketplace/trending?limit=${limit}`);
  },

  // ─── All Products ───────────────────────────────────────────────
  async getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return await this.fetch(`/api/marketplace/products?${qs}`);
  },

  // ─── Flash Sale ─────────────────────────────────────────────────
  async getFlashSale() {
    return await this.fetch('/api/marketplace/flash-sale');
  },

  // ─── Categories ─────────────────────────────────────────────────
  async getCategories() {
    return await this.fetch('/api/marketplace/categories');
  },

  // ─── Top Sellers ────────────────────────────────────────────────
  async getTopSellers() {
    return await this.fetch('/api/marketplace/top-sellers');
  },

  // ─── Health Check ───────────────────────────────────────────────
  async getHealth() {
    return await this.fetch('/health');
  },

  // ─── Search ─────────────────────────────────────────────────────
  async search(q) {
    return await this.fetch(`/api/search?q=${encodeURIComponent(q)}`);
  },

  // ─── Helper: Format Rupiah ──────────────────────────────────────
  formatRupiah(num) {
    if (!num && num !== 0) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  },

  // ─── Helper: Time Ago ───────────────────────────────────────────
  timeAgo(dateStr) {
    if (!dateStr) return '-';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} detik yang lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    return `${Math.floor(diff / 86400)} hari yang lalu`;
  }
};

// ══════════════════════════════════════════════════════════════════
// AUTO-POPULATE: Intelligence Hub
// ══════════════════════════════════════════════════════════════════
async function populateIntelligenceHub() {
  const page = window.location.pathname;
  if (!page.includes('intelligence_hub')) return;

  // Populate Product Scanner Feed table with real scraped data
  const trending = await API.getTrending(10);
  if (!trending || trending.length === 0) return;

  const tbody = document.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  trending.forEach(p => {
    const sentimentLabel = p.rating >= 4.5 ? 'POSITIVE' : p.rating >= 3.5 ? 'NEUTRAL' : 'NEGATIVE';
    const sentimentColor = p.rating >= 4.5 ? 'tertiary' : p.rating >= 3.5 ? 'secondary' : 'error';
    const viralScore = Math.min(99, Math.round((p.sold_count || 0) / 100 + (p.rating || 0) * 15));

    tbody.innerHTML += `
      <tr class="hover:bg-surface-variant/20 transition-colors">
        <td class="px-6 py-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded bg-surface-container border border-outline-variant overflow-hidden">
              <img class="w-full h-full object-cover" src="${p.image_url || ''}" alt="${p.name}" onerror="this.style.display='none'"/>
            </div>
            <div>
              <div class="font-body-md font-medium text-on-surface">${(p.name || '').substring(0, 50)}</div>
              <div class="font-data-mono text-[10px] text-on-surface-variant">Detected: ${p.marketplace} | ${p.shop_name || ''}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-5 font-data-mono text-sm text-on-surface-variant">${p.category || '-'}</td>
        <td class="px-6 py-5">
          <div class="flex items-center gap-2">
            <div class="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div class="h-full bg-primary" style="width:${viralScore}%"></div>
            </div>
            <span class="font-data-mono text-sm text-primary">${viralScore}</span>
          </div>
        </td>
        <td class="px-6 py-5">
          <span class="px-2 py-0.5 rounded-full bg-${sentimentColor}/10 text-${sentimentColor} border border-${sentimentColor}/30 font-label-caps text-[10px]">${sentimentLabel}</span>
        </td>
        <td class="px-6 py-5 text-right">
          <a href="${p.product_url || '#'}" target="_blank" class="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded font-label-caps text-[11px] transition-all inline-block">LIHAT PRODUK</a>
        </td>
      </tr>`;
  });

  // Update stats in Knowledge Base section
  const stats = await API.getStats();
  if (stats && stats.length > 0) {
    const totalProducts = stats.reduce((sum, s) => sum + parseInt(s.total_products || 0), 0);
    const lastSync = stats.reduce((latest, s) => {
      if (!latest) return s.last_scraped;
      return new Date(s.last_scraped) > new Date(latest) ? s.last_scraped : latest;
    }, null);

    const indexedEl = document.querySelector('.font-data-mono.text-primary');
    if (indexedEl && indexedEl.textContent.includes('M')) {
      indexedEl.textContent = totalProducts.toLocaleString('id-ID');
    }
    const syncEl = document.querySelector('.font-data-mono.text-tertiary');
    if (syncEl && syncEl.textContent.includes('ago')) {
      syncEl.textContent = API.timeAgo(lastSync);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// AUTO-POPULATE: Manajemen Pesanan & Stok
// ══════════════════════════════════════════════════════════════════
async function populateOrderManagement() {
  const page = window.location.pathname;
  if (!page.includes('manajemen_pesanan_stok')) return;

  const stats = await API.getStats();
  if (!stats || stats.length === 0) return;

  // Update marketplace order counts from real data
  const marketplaceMap = {};
  stats.forEach(s => {
    marketplaceMap[s.marketplace] = s;
  });

  // Update stat cards
  const statCards = document.querySelectorAll('.bg-surface-container.p-4.rounded-lg');
  statCards.forEach(card => {
    const label = card.querySelector('.font-label-caps');
    if (!label) return;
    const name = label.textContent.trim().toLowerCase();
    
    const countEl = card.querySelector('.font-display-lg, [class*="text-[32px]"]');
    const subEl = card.querySelector('.font-data-mono.text-xs');
    
    if (name.includes('shopee')) {
      const shopeeData = marketplaceMap.shopee || { total_products: 0, total_sold: 0 };
      if (countEl) countEl.textContent = shopeeData.total_products;
      if (subEl) subEl.textContent = `${shopeeData.total_sold || 0} terjual`;
    } else if (name.includes('tokopedia')) {
      const tokoData = marketplaceMap.tokopedia || { total_products: 0, total_sold: 0 };
      if (countEl) countEl.textContent = tokoData.total_products;
      if (subEl) subEl.textContent = `${tokoData.total_sold || 0} terjual`;
    } else if (name.includes('tiktok')) {
      const tiktokData = marketplaceMap.tiktok || { total_products: 0, total_sold: 0 };
      if (countEl) countEl.textContent = tiktokData.total_products;
      if (subEl) subEl.textContent = `${tiktokData.total_sold || 0} terjual`;
    }
  });

  // Update stock sync percentage  
  const syncPercent = document.querySelector('.font-headline-md.text-on-surface');
  if (syncPercent && syncPercent.textContent.includes('%')) {
    const total = stats.reduce((s, m) => s + parseInt(m.total_products || 0), 0);
    syncPercent.textContent = total > 0 ? '100%' : '0%';
  }

  // Update last sync time
  const lastUpdate = document.querySelector('.font-body-sm.text-body-sm span');
  if (lastUpdate && stats.length > 0) {
    const latest = stats.reduce((l, s) => {
      if (!l) return s.last_scraped;
      return new Date(s.last_scraped) > new Date(l) ? s.last_scraped : l;
    }, null);
    lastUpdate.textContent = API.timeAgo(latest);
  }

  // Populate restock suggestions with top products
  const products = await API.getProducts({ sort: 'sold_count', order: 'DESC', limit: 3 });
  if (!products || !products.data) return;

  const restockContainer = document.querySelector('.space-y-3');
  if (!restockContainer) return;

  restockContainer.innerHTML = '';
  products.data.forEach(p => {
    const stock = Math.floor(Math.random() * 20) + 1; // Simulated stock
    const restock = Math.floor(Math.random() * 80) + 20;
    restockContainer.innerHTML += `
      <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-surface rounded border border-outline-variant flex items-center justify-center overflow-hidden">
            <img class="w-full h-full object-cover" src="${p.image_url || ''}" alt="${p.name}" onerror="this.style.display='none'"/>
          </div>
          <div>
            <h4 class="font-body-md text-on-surface font-semibold">${(p.name || '').substring(0, 35)}</h4>
            <p class="font-data-mono text-[11px] text-error">Stok: ${stock} Unit | ${p.marketplace}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="block font-label-caps text-[10px] text-on-surface-variant">HARGA</span>
          <span class="font-data-mono text-tertiary">${API.formatRupiah(p.price)}</span>
        </div>
      </div>`;
  });
}

// ══════════════════════════════════════════════════════════════════
// AUTO-POPULATE: Analitik Eksekutif
// ══════════════════════════════════════════════════════════════════
async function populateAnalytics() {
  const page = window.location.pathname;
  if (!page.includes('analitik_eksekutif') && !page.includes('executive_analytics')) return;

  const stats = await API.getStats();
  if (!stats || stats.length === 0) return;

  const totalProducts = stats.reduce((s, m) => s + parseInt(m.total_products || 0), 0);
  const totalSold = stats.reduce((s, m) => s + parseInt(m.total_sold || 0), 0);
  const avgRating = stats.reduce((s, m) => s + parseFloat(m.avg_rating || 0), 0) / stats.length;
  const avgPrice = stats.reduce((s, m) => s + parseFloat(m.avg_price || 0), 0) / stats.length;

  // Update KPI Cards
  const kpiCards = document.querySelectorAll('.glass-panel.p-md.rounded-xl.border-l-4');
  if (kpiCards.length >= 3) {
    // CAC → Total Products
    const cacValue = kpiCards[0].querySelector('.font-headline-md.text-headline-md.text-on-surface');
    if (cacValue) cacValue.textContent = totalProducts.toLocaleString('id-ID');
    const cacLabel = kpiCards[0].querySelector('.font-label-caps.text-label-caps');
    if (cacLabel) cacLabel.textContent = 'TOTAL_PRODUK';
    
    // LTV → Total Sold
    const ltvValue = kpiCards[1].querySelector('.font-headline-md.text-headline-md.text-on-surface');
    if (ltvValue) ltvValue.textContent = totalSold.toLocaleString('id-ID');
    const ltvLabel = kpiCards[1].querySelector('.font-label-caps.text-label-caps');
    if (ltvLabel) ltvLabel.textContent = 'TOTAL_TERJUAL';

    // ROAS → Rating
    const roasValue = kpiCards[2].querySelector('.font-headline-md.text-headline-md.text-on-surface');
    if (roasValue) roasValue.textContent = avgRating.toFixed(1) + '★';
    const roasLabel = kpiCards[2].querySelector('.font-label-caps.text-label-caps');
    if (roasLabel) roasLabel.textContent = 'RATA_RATING';
  }

  // Update Forecast section with real data
  const forecastValue = document.querySelector('.font-display-lg.text-headline-lg.text-primary');
  if (forecastValue) {
    forecastValue.innerHTML = API.formatRupiah(avgPrice * totalSold * 0.15) + '<span class="font-data-mono text-lg text-on-surface-variant opacity-50 block-cursor"></span>';
  }

  // Add marketplace breakdown below the header
  const headerDiv = document.querySelector('.flex.flex-col.md\\:flex-row.md\\:items-end');
  if (headerDiv && !document.getElementById('marketplace-breakdown')) {
    const breakdownHTML = `
      <div id="marketplace-breakdown" class="col-span-12 bento-grid gap-3 mt-4" style="grid-template-columns: repeat(${stats.length}, 1fr)">
        ${stats.map(s => `
          <div class="glass-panel rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-label-caps text-[11px] text-primary uppercase">${s.marketplace}</span>
            </div>
            <div class="font-headline-md text-on-surface">${parseInt(s.total_products).toLocaleString('id-ID')}</div>
            <div class="font-data-mono text-[11px] text-on-surface-variant">
              Avg: ${API.formatRupiah(s.avg_price)} | ★${parseFloat(s.avg_rating).toFixed(1)}
            </div>
          </div>
        `).join('')}
      </div>`;
    headerDiv.insertAdjacentHTML('afterend', breakdownHTML);
  }
}

// ══════════════════════════════════════════════════════════════════
// NAVIGATION FIX: Link all nav items properly
// ══════════════════════════════════════════════════════════════════
function fixNavigation() {
  // Fix desktop nav links in analitik header
  const navSpans = document.querySelectorAll('header nav span');
  const navMap = {
    'PUSAT': '../index.html',
    'INTELIJEN': '../intelligence_hub/code.html',
    'PESANAN': '../manajemen_pesanan_stok/code.html',
    'ANALITIK': '../analitik_eksekutif/code.html'
  };

  navSpans.forEach(span => {
    const text = span.textContent.trim();
    if (navMap[text]) {
      span.style.cursor = 'pointer';
      span.addEventListener('click', () => {
        window.location.href = navMap[text];
      });
    }
  });

  // Fix bottom nav links for intelligence_hub (which uses # links)
  const bottomNavLinks = document.querySelectorAll('nav a[href="#"]');
  const iconMap = {
    'grid_view': '../index.html',
    'psychology': '../intelligence_hub/code.html',
    'inventory_2': '../manajemen_pesanan_stok/code.html',
    'monitoring': '../analitik_eksekutif/code.html'
  };

  bottomNavLinks.forEach(a => {
    const icon = a.querySelector('.material-symbols-outlined');
    if (icon && iconMap[icon.textContent.trim()]) {
      a.href = iconMap[icon.textContent.trim()];
    }
  });

  // Fix mobile bottom nav divs (analitik page uses divs instead of anchors)
  const mobileNavDivs = document.querySelectorAll('nav div.flex.flex-col');
  mobileNavDivs.forEach(div => {
    const icon = div.querySelector('.material-symbols-outlined');
    if (icon && iconMap[icon.textContent.trim()]) {
      div.style.cursor = 'pointer';
      div.addEventListener('click', () => {
        window.location.href = iconMap[icon.textContent.trim()];
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════════
// INIT ON PAGE LOAD
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  fixNavigation();
  populateIntelligenceHub();
  populateOrderManagement();
  populateAnalytics();
});
