const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

// Helper: generate signature (dummy implementation for demonstration)
function signPayload(payload) {
  const secret = process.env.GOPAY_CLIENT_SECRET || 'dummy_secret';
  const payloadString = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

// POST /api/payment/gopay
router.post('/', async (req, res) => {
  const { amount, phone } = req.body;
  try {
    const payload = {
      merchant_id: process.env.GOPAY_MERCHANT_ID,
      amount,
      phone,
    };
    payload.signature = signPayload(payload);

    // In a real scenario, you'd call the Gopay API here.
    // For demonstration/sandbox, we'll mock a successful response.
    /*
    const response = await axios.post('https://api.gopay.co.id/v2/payments', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    */
    
    // Mock response
    const mockPaymentUrl = `https://simulator.gopay.co.id/pay?merchant=${process.env.GOPAY_MERCHANT_ID}&amount=${amount}&ref=${Date.now()}`;
    const mockQrCode = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 1x1 transparent pixel as dummy

    res.json({
      success: true,
      paymentUrl: mockPaymentUrl,
      qrCode: mockQrCode
    });
  } catch (err) {
    console.error('[Gopay] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Callback endpoint
router.post('/callback', async (req, res) => {
  // Verify signature & update status in DB
  console.log('[Gopay] Callback received:', req.body);
  res.sendStatus(200);
});

module.exports = router;
