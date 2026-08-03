// ─────────────────────────────────────────────────────────────────
// Payments Service — proses pembayaran asli lewat Stripe
// (Terpisah dari backend/payment/gopay.js yang khusus Gopay Indonesia)
// ─────────────────────────────────────────────────────────────────
const express = require('express');
require('dotenv').config();
const { consume } = require('../utils/eventBus');

const app = express();
app.use(express.json());

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const isConfigured = () => Boolean(STRIPE_KEY && !STRIPE_KEY.startsWith('YOUR_'));

let stripeClient = null;
function getClient() {
  if (!stripeClient) {
    stripeClient = require('stripe')(STRIPE_KEY);
  }
  return stripeClient;
}

async function executePayment({ amount, currency, description, customer_email }) {
  if (!isConfigured()) {
    console.warn(`[Payments] ⚠️  Belum dikonfigurasi (STRIPE_SECRET_KEY masih placeholder) — payment TIDAK diproses.`);
    return { simulated: true, amount, currency };
  }
  const stripe = getClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // dalam satuan terkecil, mis. sen
    currency: currency || 'usd',
    description,
    receipt_email: customer_email
  });
  console.log(`[Payments] ✅ PaymentIntent dibuat: ${paymentIntent.id}, status=${paymentIntent.status}`);
  return { simulated: false, id: paymentIntent.id, status: paymentIntent.status, client_secret: paymentIntent.client_secret };
}

app.post('/execute', async (req, res) => {
  try {
    const { amount, currency, description, customer_email } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount wajib diisi' });
    const result = await executePayment({ amount, currency, description, customer_email });
    res.json({ status: result.simulated ? 'simulated' : 'executed', ...result });
  } catch (err) {
    console.error('[Payments] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', configured: isConfigured() }));

(async () => {
  try {
    await consume('payment_events', async (payload) => {
      console.log('[Payments] Event diterima:', payload);
      await executePayment(payload);
    });
    console.log('[Payments] Mendengarkan queue "payment_events"...');
  } catch (err) {
    console.error('[Payments] Gagal konek RabbitMQ:', err.message);
  }
})();

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`[Payments] Service listening on port ${PORT} (configured=${isConfigured()})`));
