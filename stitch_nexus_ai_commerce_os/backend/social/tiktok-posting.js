// ─────────────────────────────────────────────────────────────────
// TikTok Content Posting API — modul auto-post video
// Dipakai untuk publish video ke akun TikTok (mis. @skuypergibelanja)
// Dokumentasi resmi: https://developers.tiktok.com/doc/content-posting-api-get-started
//
// PENTING:
// - Ini BEDA dari "TikTok Shop Open API" (yang dipakai di /api/tiktok/status
//   untuk data produk/pesanan). Content Posting API khusus untuk publish
//   video ke akun kreator, pakai App terpisah di developers.tiktok.com
//   dengan produk "Content Posting API" yang sudah di-approve.
// - API ini HANYA menerima video (tidak ada foto/carousel/teks).
// - TikTok tidak punya native scheduling — jadwal tetap dikelola oleh
//   cron job kita sendiri, publish dipicu saat waktunya tiba.
// ─────────────────────────────────────────────────────────────────
const axios = require('axios');
const fs = require('fs');

const CLIENT_KEY = process.env.TIKTOK_CONTENT_CLIENT_KEY || process.env.TIKTOK_CLIENT_KEY || '';
const CLIENT_SECRET = process.env.TIKTOK_CONTENT_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://192.168.1.18/api/social/tiktok/callback';

const AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const USERINFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const INIT_UPLOAD_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
const STATUS_URL = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';

function isConfigured() {
  return Boolean(CLIENT_KEY && CLIENT_SECRET);
}

// Langkah 1: bikin link authorize — akun @skuypergibelanja buka link ini
// sekali, login TikTok, lalu approve izin posting.
function getAuthorizationUrl(state = 'skuypergibelanja') {
  if (!isConfigured()) {
    throw new Error('TIKTOK_CONTENT_CLIENT_KEY / SECRET belum diisi di .env');
  }
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    scope: 'user.info.basic,video.publish,video.upload',
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state
  });
  return `${AUTH_URL}?${params.toString()}`;
}

// Langkah 2: tukar "code" dari callback dengan access_token + refresh_token
async function exchangeCodeForToken(code) {
  const res = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data; // { access_token, refresh_token, expires_in, open_id, ... }
}

async function refreshAccessToken(refreshToken) {
  const res = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data;
}

async function getUserInfo(accessToken) {
  const res = await axios.get(USERINFO_URL, {
    params: { fields: 'open_id,display_name,avatar_url' },
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data;
}

// Langkah 3: publish video (Direct Post) — file video harus sudah ada
// di server (videoPath = path lokal file .mp4).
async function publishVideo({ accessToken, videoPath, caption, privacyLevel = 'SELF_ONLY' }) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`File video tidak ditemukan: ${videoPath}`);
  }
  const stat = fs.statSync(videoPath);
  const videoSize = stat.size;

  // 3a. Init upload
  const initRes = await axios.post(
    INIT_UPLOAD_URL,
    {
      post_info: {
        title: caption,
        privacy_level: privacyLevel, // SELF_ONLY dulu untuk testing, ganti PUBLIC_TO_EVERYONE setelah app lolos audit
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const { publish_id, upload_url } = initRes.data.data || {};
  if (!upload_url) {
    throw new Error(`TikTok init upload gagal: ${JSON.stringify(initRes.data)}`);
  }

  // 3b. Upload file video ke upload_url yang diberikan TikTok
  const videoBuffer = fs.readFileSync(videoPath);
  await axios.put(upload_url, videoBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  return { publish_id };
}

// Langkah 4: cek status publish (PROCESSING_UPLOAD -> PUBLISH_COMPLETE / FAILED)
async function checkPublishStatus(accessToken, publishId) {
  const res = await axios.post(
    STATUS_URL,
    { publish_id: publishId },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return res.data.data;
}

module.exports = {
  isConfigured,
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getUserInfo,
  publishVideo,
  checkPublishStatus
};
