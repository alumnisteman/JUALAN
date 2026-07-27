/**
 * ResellerHub AI – Shared API Client
 * Include this script di semua halaman HTML:
 *   <script src="/api-client.js"></script>
 */

(function (window) {
  'use strict';

  const BASE_URL = '';   // relatif — bekerja di semua environment

  /* ── Auth token ─────────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem('rh_token') || '';
  }
  function setToken(token) {
    localStorage.setItem('rh_token', token);
  }
  function clearToken() {
    localStorage.removeItem('rh_token');
  }
  function isLoggedIn() {
    return !!getToken();
  }

  /* ── Core fetch wrapper ──────────────────────────────────── */
  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body !== undefined) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(BASE_URL + path, opts);
    } catch (err) {
      throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan.');
    }

    if (res.status === 401) {
      clearToken();
      showToast('Sesi berakhir. Silakan login kembali.', 'error');
      return null;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  const api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path),

    /* ── Auth ─────────────────────────────────────────────── */
    auth: {
      login: async (email, password) => {
        const data = await request('POST', '/api/auth/login', { email, password });
        if (data?.token) { setToken(data.token); }
        return data;
      },
      register: async (name, email, password, storeName, phone) =>
        request('POST', '/api/auth/register', { name, email, password, storeName, phone }),
      me: () => request('GET', '/api/auth/me'),
      logout: () => { clearToken(); window.location.reload(); }
    },

    /* ── Dashboard ────────────────────────────────────────── */
    dashboard: {
      stats: () => request('GET', '/api/dashboard/stats'),
      revenueTrends: (days = 30) => request('GET', `/api/dashboard/revenue-trends?period=${days}`),
      automationStatus: () => request('GET', '/api/dashboard/automation-status')
    },

    /* ── Products ─────────────────────────────────────────── */
    products: {
      list: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/api/products${q ? '?' + q : ''}`);
      },
      get: (id) => request('GET', `/api/products/${id}`),
      create: (data) => request('POST', '/api/products', data),
      update: (id, data) => request('PUT', `/api/products/${id}`, data),
      delete: (id) => request('DELETE', `/api/products/${id}`),
      sync: (id, platform) => request('POST', `/api/products/${id}/sync/${platform}`)
    },

    /* ── Orders ───────────────────────────────────────────── */
    orders: {
      list: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/api/orders${q ? '?' + q : ''}`);
      },
      get: (id) => request('GET', `/api/orders/${id}`),
      create: (data) => request('POST', '/api/orders', data),
      updateStatus: (id, status) => request('PUT', `/api/orders/${id}/status`, { status }),
      updateShipping: (id, data) => request('PUT', `/api/orders/${id}/shipping`, data)
    },

    /* ── Inventory ────────────────────────────────────────── */
    inventory: {
      overview: () => request('GET', '/api/inventory/overview'),
      movements: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/api/inventory/movements${q ? '?' + q : ''}`);
      },
      adjust: (productId, quantity, type, reason) =>
        request('POST', '/api/inventory/adjust', { productId, quantity, type, reason }),
      restockRecommendations: () => request('GET', '/api/inventory/restock-recommendations')
    },

    /* ── AI ───────────────────────────────────────────────── */
    ai: {
      analyzeProduct: (productId) => request('POST', '/api/ai/analyze-product', { productId }),
      recommendPrice: (productId) => request('POST', '/api/ai/recommend-price', { productId }),
      generateContent: (productId, contentType) =>
        request('POST', '/api/ai/generate-content', { productId, contentType }),
      analyzeCustomer: (customerId) => request('POST', '/api/ai/analyze-customer', { customerId }),
      trends: (category, timeframe = 30) =>
        request('GET', `/api/ai/trends?category=${category || ''}&timeframe=${timeframe}`),
      detectFraud: (orderId) => request('POST', '/api/ai/detect-fraud', { orderId }),
      productHunting: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/api/ai/product-hunting${q ? '?' + q : ''}`);
      }
    },

    /* ── Marketplace ──────────────────────────────────────── */
    marketplace: {
      integrations: () => request('GET', '/api/marketplace/integrations'),
      connect: (platform, shopId, accessToken, refreshToken) =>
        request('POST', '/api/marketplace/connect', { platform, shopId, accessToken, refreshToken }),
      disconnect: (platform) => request('DELETE', `/api/marketplace/disconnect/${platform}`),
      sync: (platform, syncType = 'full') =>
        request('POST', `/api/marketplace/sync/${platform}`, { syncType }),
      orders: (platform, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/api/marketplace/${platform}/orders${q ? '?' + q : ''}`);
      },
      products: (platform) => request('GET', `/api/marketplace/${platform}/products`)
    },

    /* ── CRM ──────────────────────────────────────────────── */
    crm: {
      list: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/api/crm${q ? '?' + q : ''}`);
      },
      get: (id) => request('GET', `/api/crm/${id}`),
      create: (data) => request('POST', '/api/crm', data),
      update: (id, data) => request('PUT', `/api/crm/${id}`, data),
      orders: (id) => request('GET', `/api/crm/${id}/orders`),
      analytics: () => request('GET', '/api/crm/analytics/overview'),
      addNote: (id, note) => request('POST', `/api/crm/${id}/notes`, { note }),
      campaign: (data) => request('POST', '/api/crm/campaign', data)
    },

    /* ── Pricing ──────────────────────────────────────────── */
    pricing: {
      overview: () => request('GET', '/api/pricing/overview'),
      updateProduct: (productId, data) => request('PUT', `/api/pricing/product/${productId}`, data),
      bulkUpdate: (productIds, updates, strategy) =>
        request('POST', '/api/pricing/bulk-update', { productIds, updates, strategy }),
      recommendations: () => request('GET', '/api/pricing/recommendations'),
      applyRecommendation: (productId) => request('POST', `/api/pricing/apply-recommendation/${productId}`),
      rules: () => request('GET', '/api/pricing/rules'),
      createRule: (data) => request('POST', '/api/pricing/rules', data)
    },

    /* ── Automation ───────────────────────────────────────── */
    automation: {
      list: () => request('GET', '/api/automation'),
      toggle: (automationId, enabled) =>
        request('PUT', `/api/automation/${automationId}/toggle`, { enabled }),
      run: (automationId) => request('POST', `/api/automation/${automationId}/run`),
      history: (automationId) => request('GET', `/api/automation/${automationId}/history`)
    },

    /* ── Notifications ────────────────────────────────────── */
    notifications: {
      list: (limit = 20, unreadOnly = false) =>
        request('GET', `/api/notifications?limit=${limit}&unreadOnly=${unreadOnly}`),
      markRead: (id) => request('PUT', `/api/notifications/${id}/read`),
      markAllRead: () => request('PUT', '/api/notifications/read-all'),
      delete: (id) => request('DELETE', `/api/notifications/${id}`),
      settings: () => request('GET', '/api/notifications/settings'),
      updateSettings: (settings) => request('PUT', '/api/notifications/settings', settings)
    }
  };

  /* ── Token helpers ───────────────────────────────────────── */
  api.getToken = getToken;
  api.setToken = setToken;
  api.clearToken = clearToken;
  api.isLoggedIn = isLoggedIn;

  /* ── Toast notification system ───────────────────────────── */
  function showToast(message, type = 'info', duration = 3000) {
    const existing = document.getElementById('rh-toast-container');
    const container = existing || (() => {
      const c = document.createElement('div');
      c.id = 'rh-toast-container';
      c.style.cssText = 'position:fixed;bottom:90px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:320px;';
      document.body.appendChild(c);
      return c;
    })();

    const colors = {
      success: '#10b981',
      error:   '#ef4444',
      info:    '#6366f1',
      warning: '#f59e0b'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: rgba(15,23,42,0.95);
      border: 1px solid ${colors[type] || colors.info}55;
      border-left: 3px solid ${colors[type] || colors.info};
      color: #e4e1ed;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Plus Jakarta Sans', Inter, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transform: translateX(120%);
      transition: transform 0.3s ease;
      cursor: pointer;
      line-height: 1.4;
    `;
    toast.textContent = message;
    toast.onclick = () => removeToast(toast);
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    const timer = setTimeout(() => removeToast(toast), duration);

    function removeToast(el) {
      clearTimeout(timer);
      el.style.transform = 'translateX(120%)';
      setTimeout(() => el.remove(), 300);
    }
  }

  /* ── Loading state helper ────────────────────────────────── */
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn._origText = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.8s linear infinite">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>Memproses...</span>`;
    } else {
      btn.disabled = false;
      btn.style.opacity = '';
      if (btn._origText) btn.innerHTML = btn._origText;
    }
  }

  /* ── Format helpers ─────────────────────────────────────── */
  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  }
  function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  }
  function timeAgo(date) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  }

  api.showToast = showToast;
  api.setLoading = setLoading;
  api.formatRupiah = formatRupiah;
  api.formatNumber = formatNumber;
  api.timeAgo = timeAgo;

  /* ── Inject global spinner CSS ───────────────────────────── */
  if (!document.getElementById('rh-api-styles')) {
    const style = document.createElement('style');
    style.id = 'rh-api-styles';
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  window.RH = api;
})(window);
