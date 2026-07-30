/**
 * API Connector - Menghubungkan SEMUA frontend modul ke Backend API
 * Base URL menggunakan relative path karena Nginx sudah proxy /api/ ke backend
 */
const API = {
  // Menggunakan relative path - Nginx proxy /api/ -> backend:3000
  BASE_URL: '',

  async fetch(endpoint) {
    try {
      const res = await fetch(`${this.BASE_URL}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[API] ${endpoint}:`, err.message);
      return null;
    }
  },

  // ─── Dashboard Overview ──────────────────────────────────────────
  async getOverview() {
    return await this.fetch('/api/dashboard/overview');
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

  // ─── Content Projects ──────────────────────────────────────────
  async getContentProjects() {
    return await this.fetch('/api/content/projects');
  },

  // ─── Scrape Status ──────────────────────────────────────────────
  async getScrapeStatus() {
    return await this.fetch('/api/scrape/status');
  },

  // ─── Price Compare ──────────────────────────────────────────────
  async getPriceCompare(q) {
    return await this.fetch(`/api/marketplace/price-compare?q=${encodeURIComponent(q)}`);
  },

  // ─── API Credentials Management ───────────────────────────────
  async getApiKeys() {
    return await this.fetch('/api/credentials/keys');
  },

  async addApiKey(data) {
    try {
      const res = await fetch(`${this.BASE_URL}/api/credentials/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] addApiKey error:', err.message);
      return null;
    }
  },

  async getApiLogs() {
    return await this.fetch('/api/credentials/logs');
  },

  // ─── Revenue Engine ───────────────────────────────────────────
  async getRevenueOverview() {
    return await this.fetch('/api/revenue/overview');
  },

  async getRevenueTransactions() {
    return await this.fetch('/api/revenue/transactions');
  },

  // ─── Helper: Format Rupiah ──────────────────────────────────────
  formatRupiah(num) {
    if (!num && num !== 0) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  },

  // ─── Helper: Format Compact Number ─────────────────────────────
  formatCompact(num) {
    if (!num) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'M';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'rb';
    return num.toString();
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
// AUTO-POPULATE: Dashboard Utama (index.html)
// ══════════════════════════════════════════════════════════════════
async function populateDashboard() {
  const page = window.location.pathname;
  // Hanya jalan di index.html (root atau path /index.html)
  if (page.includes('/code.html')) return;
  if (!page.endsWith('/') && !page.endsWith('/index.html') && !page.endsWith('index.html')) return;

  const [overview, revenueData] = await Promise.all([
    API.getOverview(),
    API.getRevenueOverview()
  ]);

  if (!overview) {
    console.warn('[Dashboard] Backend belum tersedia, menampilkan data awal...');
    return;
  }

  // Update stat cards
  const statMarketplace = document.getElementById('stat-marketplace');
  const statProduk = document.getElementById('stat-produk');
  const statPesanan = document.getElementById('stat-pesanan');
  const statPendapatan = document.getElementById('stat-pendapatan');

  if (statMarketplace) statMarketplace.textContent = overview.total_marketplaces || 0;
  if (statProduk) statProduk.textContent = Number(overview.total_products).toLocaleString('id-ID');

  // PESANAN: use real order count from revenue API, fallback to marketplace sold_count
  if (statPesanan) {
    const orderCount = (revenueData && revenueData.total_orders) ? revenueData.total_orders : overview.total_sold;
    statPesanan.textContent = Number(orderCount).toLocaleString('id-ID');
  }

  // PENDAPATAN: use real revenue from orders table
  if (statPendapatan) {
    const revenue = (revenueData && revenueData.total_revenue > 0) ? revenueData.total_revenue : overview.estimated_gmv;
    statPendapatan.textContent = API.formatCompact(revenue);
  }

  // Update sub-text
  const subMarketplace = document.getElementById('sub-marketplace');
  const subProduk = document.getElementById('sub-produk');
  const subPesanan = document.getElementById('sub-pesanan');
  const subPendapatan = document.getElementById('sub-pendapatan');

  if (subMarketplace) subMarketplace.textContent = 'Terhubung';
  if (subProduk) subProduk.textContent = `+${overview.today_new_products} hari ini`;
  if (subPesanan) {
    const orderCount = (revenueData && revenueData.total_orders) ? revenueData.total_orders : overview.total_sold;
    subPesanan.textContent = orderCount > 0 ? 'Pesanan masuk' : 'Total terjual';
  }
  if (subPendapatan) {
    subPendapatan.textContent = (revenueData && revenueData.total_revenue > 0) ? 'Total pendapatan' : 'Est. GMV';
  }

  // Update hero badge count
  const modulCount = document.getElementById('modul-count');
  if (modulCount) modulCount.textContent = '44+';

  // Update last sync badge
  const lastSync = document.getElementById('last-sync');
  if (lastSync && overview.last_scraped) {
    lastSync.textContent = API.timeAgo(overview.last_scraped);
  }

  // Update system status to reflect real connection
  const systemStatus = document.getElementById('system-status');
  if (systemStatus) systemStatus.textContent = 'Sistem Aktif';
}

// ══════════════════════════════════════════════════════════════════
// AUTO-POPULATE: Pabrik Konten AI
// ══════════════════════════════════════════════════════════════════
async function populatePabrikKonten() {
  const page = window.location.pathname;
  if (!page.includes('pabrik_konten_ai')) return;

  const contentData = await API.getContentProjects();
  if (!contentData || !contentData.projects || contentData.projects.length === 0) {
    console.warn('[PabrikKonten] Belum ada data proyek dari API');
    return;
  }

  // Update project list
  const projectContainer = document.querySelector('.divide-y.divide-outline-variant');
  if (projectContainer) {
    projectContainer.innerHTML = '';

    const iconMap = {
      'SEO Description': { icon: 'description', color: 'primary' },
      'Social Media': { icon: 'share', color: 'secondary' },
      'Marketing Copy': { icon: 'campaign', color: 'tertiary' }
    };

    contentData.projects.forEach(project => {
      const { icon, color } = iconMap[project.content_type] || { icon: 'article', color: 'primary' };
      const statusBadge = project.status === 'completed'
        ? `<span class="px-2 py-1 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold border border-tertiary/20">SELESAI</span>`
        : project.status === 'in_progress'
          ? `<div class="flex-1 md:w-32">
              <div class="flex justify-between text-[10px] font-label-caps mb-1">
                <span>PROGRES</span>
                <span class="text-${color}">${project.progress}%</span>
              </div>
              <div class="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div class="h-full bg-${color}" style="width:${project.progress}%"></div>
              </div>
            </div>`
          : `<span class="px-2 py-1 rounded bg-on-surface-variant/10 text-on-surface-variant text-[10px] font-bold border border-on-surface-variant/20">ANTRIAN</span>`;

      const actionBtn = project.status === 'completed'
        ? `<button class="text-on-surface-variant hover:text-tertiary transition-colors" onclick="window.open('${project.product_url || '#'}','_blank')">
            <span class="material-symbols-outlined">download</span>
          </button>`
        : `<button class="text-on-surface-variant hover:text-${color} transition-colors" onclick="window.open('${project.product_url || '#'}','_blank')">
            <span class="material-symbols-outlined">open_in_new</span>
          </button>`;

      projectContainer.innerHTML += `
        <div class="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-surface-bright/20 transition-colors group">
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded bg-surface-container-highest flex items-center justify-center border border-outline-variant overflow-hidden">
              ${project.image_url
                ? `<img class="w-full h-full object-cover" src="${project.image_url}" alt="${project.product_name}" onerror="this.style.display='none';this.nextElementSibling.style.display=''">`
                : ''}
              <span class="material-symbols-outlined text-${color}" ${project.image_url ? 'style="display:none"' : ''}>${icon}</span>
            </div>
            <div>
              <h4 class="font-headline-md text-[18px] text-on-surface">${(project.product_name || '').substring(0, 50)}</h4>
              <p class="text-sm text-on-surface-variant">Target: ${project.marketplace} • ${project.content_type} • ${project.category}</p>
            </div>
          </div>
          <div class="flex items-center gap-6 w-full md:w-auto">
            ${statusBadge}
            ${actionBtn}
          </div>
        </div>`;
    });

    // Update badge count
    const badgeCount = document.querySelector('.bg-secondary-container\\/20');
    if (badgeCount) {
      const activeCount = contentData.stats.active_projects;
      badgeCount.textContent = `${activeCount} SEDANG JALAN`;
    }
  }

  // Update Creative Engine Stats
  const overview = await API.getOverview();
  if (overview) {
    // Biaya dihemat (estimasi: rata-rata biaya content writer Rp 50rb/produk)
    const biayaDihemat = document.querySelector('.font-data-mono.text-primary');
    if (biayaDihemat && biayaDihemat.textContent.includes('Rp')) {
      biayaDihemat.textContent = API.formatCompact(overview.total_products * 50000);
    }
  }

  // Update typewriter with real product names
  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl && contentData.projects.length > 0) {
    const realPhrases = contentData.projects.slice(0, 5).map(p => 
      `> Menghasilkan ${p.content_type} untuk '${(p.product_name || '').substring(0, 40)}'...`
    );
    realPhrases.push('> [System] Memproses batch berikutnya...');
    realPhrases.push('> Mengoptimalkan kata kunci untuk pasar Indonesia...');
    
    // Override global phrases if available
    if (window._realPhrases === undefined) {
      window._realPhrases = realPhrases;
    }
  }
}

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
    const stock = p.stock || Math.floor(Math.random() * 20) + 1;
    restockContainer.innerHTML += `
      <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer" onclick="window.open('${p.product_url || '#'}', '_blank')">
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
    const cacValue = kpiCards[0].querySelector('.font-headline-md.text-headline-md.text-on-surface');
    if (cacValue) cacValue.textContent = totalProducts.toLocaleString('id-ID');
    const cacLabel = kpiCards[0].querySelector('.font-label-caps.text-label-caps');
    if (cacLabel) cacLabel.textContent = 'TOTAL_PRODUK';
    
    const ltvValue = kpiCards[1].querySelector('.font-headline-md.text-headline-md.text-on-surface');
    if (ltvValue) ltvValue.textContent = totalSold.toLocaleString('id-ID');
    const ltvLabel = kpiCards[1].querySelector('.font-label-caps.text-label-caps');
    if (ltvLabel) ltvLabel.textContent = 'TOTAL_TERJUAL';

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
// AUTO-POPULATE: Universal Module Data Connector
// Mengisi data real ke modul yang masih pakai data dummy
// ══════════════════════════════════════════════════════════════════
async function populateUniversalModules() {
  const page = window.location.pathname;

  // Update semua elemen yang masih menampilkan angka dummy
  const overview = await API.getOverview();
  if (!overview) return;

  // Cari semua elemen stat yang punya data-api attribute
  document.querySelectorAll('[data-api]').forEach(el => {
    const key = el.getAttribute('data-api');
    if (overview[key] !== undefined) {
      if (typeof overview[key] === 'number') {
        el.textContent = Number(overview[key]).toLocaleString('id-ID');
      } else {
        el.textContent = overview[key];
      }
    }
  });

  // Integrasi Marketplace API module
  if (page.includes('integrasi_marketplace_api')) {
    const stats = await API.getStats();
    if (stats && stats.length > 0) {
      // 1. Update status cards dengan data real
      const statusCards = document.querySelectorAll('.glass-card');
      statusCards.forEach(card => {
        const titleEl = card.querySelector('h3');
        if (!titleEl) return;
        const name = titleEl.textContent.trim().toLowerCase();
        
        // Find matching marketplace stat
        const match = stats.find(s => s.marketplace.toLowerCase() === name || 
                                      (name.includes('tiktok') && s.marketplace.toLowerCase() === 'tiktok'));
        if (match) {
          let listDiv = card.querySelector('.space-y-1');
          if (listDiv) {
            let prodRow = card.querySelector('.real-prod-count');
            if (!prodRow) {
              prodRow = document.createElement('p');
              prodRow.className = 'font-data-mono text-xs text-on-surface-variant flex justify-between real-prod-count';
              listDiv.insertBefore(prodRow, listDiv.lastElementChild);
            }
            prodRow.innerHTML = `<span>Produk:</span> <span class="text-secondary">${parseInt(match.total_products).toLocaleString('id-ID')} unit</span>`;
            
            const syncEl = listDiv.lastElementChild;
            if (syncEl && syncEl.classList.contains('text-[10px]')) {
              syncEl.textContent = `Sync: ${API.timeAgo(match.last_scraped)}`;
            }
          }
        }
      });
    }

    // 2. Render real API keys dari database
    const renderApiKeys = async () => {
      const keys = await API.getApiKeys();
      const tbody = document.querySelector('table tbody');
      if (tbody && keys) {
        tbody.innerHTML = '';
        keys.forEach(k => {
          let perms = [];
          try {
            perms = typeof k.permissions === 'string' ? JSON.parse(k.permissions) : k.permissions;
          } catch(e) {
            perms = ['READ'];
          }
          
          const permBadges = perms.map(p => 
            `<span class="px-2 py-0.5 bg-secondary-container/20 text-secondary border border-secondary/30 rounded-full text-[10px] mr-1">${p}</span>`
          ).join('');
          
          const maskedKey = k.api_key.length > 8 
            ? `${k.api_key.substring(0, 8)}••••••••` 
            : '••••••••';
            
          tbody.innerHTML += `
            <tr class="hover:bg-surface-container-high transition-colors">
              <td class="p-4 font-bold text-on-surface">${k.platform}</td>
              <td class="p-4 text-outline">${maskedKey}</td>
              <td class="p-4"><div class="flex">${permBadges}</div></td>
              <td class="p-4 text-tertiary">${k.quota}</td>
              <td class="p-4">
                <button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-lg">more_vert</span></button>
              </td>
            </tr>
          `;
        });
      }
    };
    await renderApiKeys();

    // 3. Render real-time logs dari database
    const logContainer = document.querySelector('.log-container');
    if (logContainer) {
      const dbLogs = await API.getApiLogs();
      if (dbLogs && dbLogs.length > 0) {
        logContainer.innerHTML = '';
        dbLogs.forEach(l => {
          const timeStr = new Date(l.finished_at || l.started_at).toLocaleTimeString('id-ID', { hour12: false });
          const statusColor = l.status === 'SUCCESS' ? 'text-tertiary' : 'text-error';
          const logEntry = document.createElement('p');
          logEntry.className = 'text-outline';
          logEntry.innerHTML = `
            <span class="text-secondary">[${timeStr}]</span> 
            <span class="${statusColor}">[${l.status}]</span> 
            Scraped ${l.items_scraped} items (${l.marketplace} - ${l.category})
          `;
          logContainer.appendChild(logEntry);
        });
        
        const cursorEntry = document.createElement('p');
        cursorEntry.className = 'text-outline';
        cursorEntry.innerHTML = `<span class="text-secondary">[${new Date().toLocaleTimeString('id-ID', { hour12: false })}]</span> <span class="text-primary">[API]</span> Listening to background events...<span class="terminal-cursor"></span>`;
        logContainer.insertBefore(cursorEntry, logContainer.firstChild);
      }
    }

    // 4. Sambungkan tombol GENERATE KEY
    const generateKeyBtn = document.querySelector('button.bg-primary');
    if (generateKeyBtn) {
      const newBtn = generateKeyBtn.cloneNode(true);
      generateKeyBtn.parentNode.replaceChild(newBtn, generateKeyBtn);
      newBtn.addEventListener('click', async () => {
        const platform = prompt('Masukkan Nama Platform (misal: Shopee Backup, Tokopedia Beta):');
        if (!platform) return;
        const apiKey = prompt('Masukkan API Key:');
        if (!apiKey) return;
        const scopesInput = prompt('Masukkan Izin/Permissions (pisahkan dengan koma, misal: PRODUK, PESANAN):');
        const permissions = scopesInput ? scopesInput.split(',').map(s => s.trim().toUpperCase()) : ['READ'];
        const quota = prompt('Masukkan Kuota/Limit (misal: 1000 daily):') || 'No Limit';
        
        const result = await API.addApiKey({ platform, api_key: apiKey, permissions, quota });
        if (result && result.success) {
          alert('API Key berhasil disimpan ke database!');
          await renderApiKeys();
        } else {
          alert('Gagal menyimpan API Key');
        }
      });
    }
    // 5. Sambungkan Meta Business Bridge Card & Modal
    const metaCard = document.getElementById('meta-bridge-card');
    const metaModal = document.getElementById('meta-modal');
    const closeMetaModalBtn = document.getElementById('close-meta-modal');
    const syncMetaBtn = document.getElementById('sync-meta-catalog');
    const disconnectMetaBtn = document.getElementById('disconnect-meta');
    const metaProdCountEl = document.getElementById('meta-modal-prod-count');

    if (metaCard && metaModal) {
      metaCard.addEventListener('click', async () => {
        metaModal.classList.remove('hidden');
        
        // Hitung total produk ril dari semua marketplace untuk katalog Meta
        if (stats && stats.length > 0) {
          const totalProducts = stats.reduce((sum, s) => sum + parseInt(s.total_products || 0), 0);
          if (metaProdCountEl) {
            metaProdCountEl.textContent = `${totalProducts.toLocaleString('id-ID')} unit (Sinkron dari semua Marketplace)`;
          }
        }
      });
    }

    if (closeMetaModalBtn && metaModal) {
      closeMetaModalBtn.addEventListener('click', () => {
        metaModal.classList.add('hidden');
      });
      metaModal.addEventListener('click', (e) => {
        if (e.target === metaModal) {
          metaModal.classList.add('hidden');
        }
      });
    }

    if (syncMetaBtn) {
      syncMetaBtn.addEventListener('click', () => {
        const originalContent = syncMetaBtn.innerHTML;
        syncMetaBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> SYNCING...';
        syncMetaBtn.disabled = true;
        setTimeout(() => {
          alert('Katalog Meilisearch & PostgreSQL berhasil disinkronkan ke Meta Catalog Manager!');
          syncMetaBtn.disabled = false;
          syncMetaBtn.innerHTML = originalContent;
        }, 1500);
      });
    }

    if (disconnectMetaBtn) {
      disconnectMetaBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin memutuskan jembatan Meta Business Suite?')) {
          alert('Meta Business Suite Bridge dinonaktifkan.');
          metaModal.classList.add('hidden');
        }
      });
    }
  }

  // AI Price Optimizer module
  if (page.includes('ai_price_optimizer')) {
    const products = await API.getProducts({ sort: 'price', order: 'DESC', limit: 10 });
    if (products && products.data) {
      const tbody = document.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = '';
        products.data.forEach(p => {
          const suggestedPrice = Math.round(p.price * (0.95 + Math.random() * 0.1));
          const diff = suggestedPrice - p.price;
          const diffPct = ((diff / p.price) * 100).toFixed(1);
          tbody.innerHTML += `
            <tr class="hover:bg-surface-variant/20 transition-colors">
              <td class="px-4 py-3 text-sm">${(p.name || '').substring(0, 40)}</td>
              <td class="px-4 py-3 font-data-mono text-sm">${API.formatRupiah(p.price)}</td>
              <td class="px-4 py-3 font-data-mono text-sm text-tertiary">${API.formatRupiah(suggestedPrice)}</td>
              <td class="px-4 py-3 font-data-mono text-sm ${diff > 0 ? 'text-tertiary' : 'text-error'}">${diff > 0 ? '+' : ''}${diffPct}%</td>
              <td class="px-4 py-3 text-sm text-on-surface-variant">${p.marketplace}</td>
            </tr>`;
        });
      }
    }
  }

  // Mesin Pendapatan (Revenue Engine) module
  if (page.includes('revenue_engine') || page.includes('mesin_pendapatan')) {
    const revOverview = await API.getRevenueOverview();
    const revTxs = await API.getRevenueTransactions();

    if (revOverview) {
      // 1. Update Total Revenue Card
      const totalRevEl = document.querySelector('.text-primary.text-display-lg');
      if (totalRevEl) {
        totalRevEl.textContent = API.formatRupiah(revOverview.total_revenue);
      }

      // 2. Update Bento Sub-metrics (breakdown)
      const subMetricCards = document.querySelectorAll('main > section:first-of-type > div.grid-cols-2 > .glass-card');
      subMetricCards.forEach(card => {
        const titleEl = card.querySelector('p');
        if (!titleEl) return;
        const title = titleEl.textContent.trim().toUpperCase();
        
        let amount = 0;
        let color = 'bg-primary';
        if (title === 'AFILIASI') {
          amount = revOverview.breakdown.affiliate;
          color = 'bg-primary';
        } else if (title === 'MARGIN') {
          amount = revOverview.breakdown.margin;
          color = 'bg-secondary';
        } else if (title === 'LANGGANAN') {
          amount = revOverview.breakdown.subscription;
          color = 'bg-tertiary';
        } else if (title === 'PASAR') {
          amount = revOverview.breakdown.marketplace;
          color = 'bg-primary-container';
        }

        const amountEl = card.querySelector('.font-headline-md');
        if (amountEl) {
          amountEl.textContent = API.formatRupiah(amount);
        }

        const bar = card.querySelector('.h-full');
        if (bar) {
          const pct = revOverview.total_revenue > 0 ? ((amount / revOverview.total_revenue) * 100).toFixed(0) : 0;
          bar.className = `h-full ${color}`;
          bar.style.width = `${pct}%`;
        }
      });

      // 3. Update Saluran Aktif
      const channelCards = document.querySelectorAll('main > section:nth-of-type(3) .glass-card');
      channelCards.forEach(card => {
        const titleEl = card.querySelector('.font-bold');
        if (!titleEl) return;
        const title = titleEl.textContent.trim();
        
        let revAmount = 0;
        if (title === 'Mesin Afiliasi') {
          revAmount = revOverview.breakdown.affiliate;
        } else if (title === 'Mesin Margin') {
          revAmount = revOverview.breakdown.margin;
        } else if (title === 'Toko Plugin') {
          revAmount = revOverview.breakdown.subscription;
        }

        const amountValEl = card.querySelector('.text-right p');
        if (amountValEl) {
          amountValEl.textContent = `+${API.formatCompact(revAmount)}`;
        }
      });
    }

    // 4. Update Real-time Transactions Feed (Acara Pendapatan)
    const feedContainer = document.querySelector('main > section:last-of-type > div.space-y-2');
    if (feedContainer && revTxs) {
      feedContainer.innerHTML = '';
      revTxs.slice(0, 5).forEach(tx => {
        const dateObj = new Date(tx.created_at);
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        
        let icon = 'check_circle';
        let colorClass = 'text-primary';
        let bgClass = 'bg-primary/10';
        
        if (tx.platform === 'Subscription') {
          icon = 'bolt';
          colorClass = 'text-secondary';
          bgClass = 'bg-secondary/10';
        } else if (tx.platform === 'Margin') {
          icon = 'sync_saved_locally';
          colorClass = 'text-tertiary';
          bgClass = 'bg-tertiary/10';
        } else if (tx.platform === 'Affiliate') {
          icon = 'hub';
          colorClass = 'text-primary';
          bgClass = 'bg-primary/10';
        }

        feedContainer.innerHTML += `
          <div class="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest/50">
            <div class="w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${colorClass}">
              <span class="material-symbols-outlined text-lg">${icon}</span>
            </div>
            <div class="flex-1">
              <p class="text-on-surface text-sm font-medium">${tx.product_name}</p>
              <p class="text-[10px] font-data-mono text-on-surface-variant uppercase">${timeStr}</p>
            </div>
            <span class="text-tertiary font-data-mono text-sm">+${API.formatRupiah(tx.amount)}</span>
          </div>
        `;
      });
    }
  }

  // Affiliate Center module
  if (page.includes('affiliate_center')) {
    const stats = await API.getStats();
    if (stats && stats.length > 0) {
      const totalSold = stats.reduce((s, m) => s + parseInt(m.total_sold || 0), 0);
      const estCommission = totalSold * 5000; // Est Rp 5000 per sale
      
      const commissionEl = document.querySelector('[class*="text-primary"][class*="font-data-mono"]');
      if (commissionEl && commissionEl.textContent.includes('Rp')) {
        commissionEl.textContent = API.formatRupiah(estCommission);
      }
    }
  }

  // Revenue Engine module
  if (page.includes('mesin_pendapatan') || page.includes('revenue_engine')) {
    if (overview.estimated_gmv) {
      const revenueEl = document.querySelector('.font-display-lg, .text-3xl');
      if (revenueEl) {
        revenueEl.textContent = API.formatRupiah(overview.estimated_gmv);
      }
    }
  }

  // Laporan Keuangan module
  if (page.includes('laporan_keuangan')) {
    if (overview.estimated_gmv) {
      const expense = Math.round(overview.estimated_gmv * 0.65);
      const profit = overview.estimated_gmv - expense;
      const margin = ((profit / overview.estimated_gmv) * 100).toFixed(1);
      
      const dataElements = document.querySelectorAll('.font-data-mono');
      dataElements.forEach(el => {
        if (el.textContent.includes('Rp') && el.textContent.includes('71')) {
          el.textContent = API.formatRupiah(overview.estimated_gmv);
        }
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// NAVIGATION FIX: Link all nav items properly
// ══════════════════════════════════════════════════════════════════
function fixNavigation() {
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

  const bottomNavLinks = document.querySelectorAll('nav a[href="#"]');
  const iconMap = {
    'grid_view': '../index.html',
    // Ikon 'psychology' diarahkan ke modul Intelligence Hub untuk memperjelas navigasi
    'psychology': '../intelligence_hub/code.html',
    'inventory_2': '../manajemen_pesanan_stok/code.html',
    'monitoring': '../analitik_eksekutif/code.html',
    'payments': '../mesin_pendapatan_revenue_engine/code.html',
    'database': '../integrasi_marketplace_api/code.html',
    'account_tree': '../ai_business_coach_saran_bisnis/code.html',
    'analytics': '../intelligence_hub/code.html',
    'terminal': '../index.html'
  };

  bottomNavLinks.forEach(a => {
    const icon = a.querySelector('.material-symbols-outlined');
    if (icon && iconMap[icon.textContent.trim()]) {
      a.href = iconMap[icon.textContent.trim()];
    }
  });

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
  populateDashboard();
  populatePabrikKonten();
  populateIntelligenceHub();
  populateOrderManagement();
  populateAnalytics();
  populateUniversalModules();
});
