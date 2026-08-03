// ─────────────────────────────────────────────────────────────────
// Instagram Graph API — modul auto-post foto/carousel/reels
// Dokumentasi resmi: https://developers.facebook.com/docs/instagram-platform
//
// SYARAT (harus dipenuhi manual oleh pemilik akun sebelum modul ini jalan):
// 1. Akun IG harus tipe Business/Creator, ditautkan ke Facebook Page.
// 2. Meta App (developers.facebook.com) dengan produk "Instagram Graph API".
// 3. App Review disetujui untuk permission instagram_business_content_publish.
// Tanpa 3 syarat itu, endpoint di bawah akan selalu gagal — itu memang
// aturan dari Meta, bukan bug di modul ini.
// ─────────────────────────────────────────────────────────────────
const axios = require('axios');

const APP_ID = process.env.INSTAGRAM_APP_ID || '';
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || '';
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://192.168.1.18/api/social/instagram/callback';
const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function isConfigured() {
  return Boolean(APP_ID && APP_SECRET);
}

// Langkah 1: link authorize Facebook Login (untuk dapat akses ke Page + IG Business account)
function getAuthorizationUrl(state = 'skuypergibelanja') {
  if (!isConfigured()) {
    throw new Error('INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET belum diisi di .env');
  }
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    response_type: 'code',
    state
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

// Langkah 2: tukar code -> short-lived token -> long-lived token (60 hari)
async function exchangeCodeForToken(code) {
  const shortRes = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
    params: {
      client_id: APP_ID,
      client_secret: APP_SECRET,
      redirect_uri: REDIRECT_URI,
      code
    }
  });
  const shortToken = shortRes.data.access_token;

  const longRes = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      fb_exchange_token: shortToken
    }
  });
  return longRes.data; // { access_token, token_type, expires_in }
}

// Langkah 3: cari Instagram Business Account ID dari Page yang di-manage user
async function getInstagramBusinessAccount(userAccessToken) {
  const pagesRes = await axios.get(`${GRAPH_BASE}/me/accounts`, {
    params: { access_token: userAccessToken }
  });
  const pages = pagesRes.data.data || [];
  if (pages.length === 0) {
    throw new Error('Tidak ada Facebook Page yang bisa diakses akun ini — pastikan Page sudah ditautkan.');
  }

  for (const page of pages) {
    const igRes = await axios.get(`${GRAPH_BASE}/${page.id}`, {
      params: { fields: 'instagram_business_account', access_token: page.access_token }
    });
    if (igRes.data.instagram_business_account) {
      return {
        igUserId: igRes.data.instagram_business_account.id,
        pageAccessToken: page.access_token,
        pageName: page.name
      };
    }
  }
  throw new Error('Tidak ada akun Instagram Business yang tertaut ke Page manapun.');
}

// Langkah 4: publish (2 tahap — container lalu publish)
async function publishImage({ igUserId, pageAccessToken, imageUrl, caption }) {
  const containerRes = await axios.post(`${GRAPH_BASE}/${igUserId}/media`, null, {
    params: { image_url: imageUrl, caption, access_token: pageAccessToken }
  });
  const creationId = containerRes.data.id;

  const publishRes = await axios.post(`${GRAPH_BASE}/${igUserId}/media_publish`, null, {
    params: { creation_id: creationId, access_token: pageAccessToken }
  });
  return publishRes.data; // { id: <media_id> }
}

async function publishReel({ igUserId, pageAccessToken, videoUrl, caption }) {
  const containerRes = await axios.post(`${GRAPH_BASE}/${igUserId}/media`, null, {
    params: { media_type: 'REELS', video_url: videoUrl, caption, access_token: pageAccessToken }
  });
  const creationId = containerRes.data.id;

  // Reels butuh waktu proses video — polling status dulu sebelum publish
  let status = 'IN_PROGRESS';
  for (let i = 0; i < 10 && status === 'IN_PROGRESS'; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await axios.get(`${GRAPH_BASE}/${creationId}`, {
      params: { fields: 'status_code', access_token: pageAccessToken }
    });
    status = statusRes.data.status_code;
  }
  if (status !== 'FINISHED') {
    throw new Error(`Video container belum selesai diproses Meta (status: ${status})`);
  }

  const publishRes = await axios.post(`${GRAPH_BASE}/${igUserId}/media_publish`, null, {
    params: { creation_id: creationId, access_token: pageAccessToken }
  });
  return publishRes.data;
}

module.exports = {
  isConfigured,
  getAuthorizationUrl,
  exchangeCodeForToken,
  getInstagramBusinessAccount,
  publishImage,
  publishReel
};
