// ─────────────────────────────────────────────────────────────────
// WhatsApp Service — kirim pesan WhatsApp asli lewat Twilio
// Dengar event 'whatsapp_events' dari RabbitMQ, dan juga expose
// endpoint HTTP langsung (/send) untuk dipanggil manual.
// ─────────────────────────────────────────────────────────────────
const express = require('express');
require('dotenv').config();
const { consume } = require('../utils/eventBus');

const app = express();
app.use(express.json());

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WHATSAPP_FROM = process.env.WHATSAPP_NUMBER; // format: whatsapp:+62xxxxxxxxxx

const isConfigured = () =>
  Boolean(TWILIO_SID && TWILIO_TOKEN && !TWILIO_SID.startsWith('YOUR_'));

let twilioClient = null;
function getClient() {
  if (!twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
  }
  return twilioClient;
}

async function sendWhatsApp({ to, body }) {
  if (!isConfigured()) {
    console.warn(`[WhatsApp] ⚠️  Belum dikonfigurasi (TWILIO_ACCOUNT_SID/AUTH_TOKEN masih placeholder di .env) — pesan ke ${to} TIDAK dikirim.`);
    return { simulated: true, to, body };
  }
  const client = getClient();
  const msg = await client.messages.create({
    from: WHATSAPP_FROM,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    body
  });
  console.log(`[WhatsApp] ✅ Terkirim ke ${to}, sid=${msg.sid}`);
  return { simulated: false, sid: msg.sid };
}

// Endpoint manual
app.post('/send', async (req, res) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'to dan body wajib diisi' });
    const result = await sendWhatsApp({ to, body });
    res.json({ status: result.simulated ? 'simulated' : 'sent', ...result });
  } catch (err) {
    console.error('[WhatsApp] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', configured: isConfigured() }));

// Dengar event dari RabbitMQ (dipublish dari webhook/scheduler/backend)
(async () => {
  try {
    await consume('whatsapp_events', async (payload) => {
      console.log('[WhatsApp] Event diterima:', payload);
      await sendWhatsApp(payload);
    });
    console.log('[WhatsApp] Mendengarkan queue "whatsapp_events"...');
  } catch (err) {
    console.error('[WhatsApp] Gagal konek RabbitMQ:', err.message);
  }
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[WhatsApp] Service listening on port ${PORT} (configured=${isConfigured()})`));
