// ─────────────────────────────────────────────────────────────────
// Email Service — kirim email asli lewat SendGrid
// ─────────────────────────────────────────────────────────────────
const express = require('express');
require('dotenv').config();
const { consume } = require('../utils/eventBus');

const app = express();
app.use(express.json());

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const isConfigured = () => Boolean(SENDGRID_KEY && !SENDGRID_KEY.startsWith('YOUR_'));

let sgMail = null;
function getClient() {
  if (!sgMail) {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_KEY);
  }
  return sgMail;
}

async function sendEmail({ to, from, subject, text, html }) {
  if (!isConfigured()) {
    console.warn(`[Email] ⚠️  Belum dikonfigurasi (SENDGRID_API_KEY masih placeholder) — email ke ${to} TIDAK dikirim.`);
    return { simulated: true, to, subject };
  }
  const client = getClient();
  const [resp] = await client.send({
    to,
    from: from || process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.com',
    subject,
    text,
    html: html || text
  });
  console.log(`[Email] ✅ Terkirim ke ${to}, status=${resp.statusCode}`);
  return { simulated: false, statusCode: resp.statusCode };
}

app.post('/send', async (req, res) => {
  try {
    const { to, from, subject, text, html } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to dan subject wajib diisi' });
    const result = await sendEmail({ to, from, subject, text, html });
    res.json({ status: result.simulated ? 'simulated' : 'sent', ...result });
  } catch (err) {
    console.error('[Email] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', configured: isConfigured() }));

(async () => {
  try {
    await consume('email_events', async (payload) => {
      console.log('[Email] Event diterima:', payload);
      await sendEmail(payload);
    });
    console.log('[Email] Mendengarkan queue "email_events"...');
  } catch (err) {
    console.error('[Email] Gagal konek RabbitMQ:', err.message);
  }
})();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[Email] Service listening on port ${PORT} (configured=${isConfigured()})`));
