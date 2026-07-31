// backend/api.js
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const { publish } = require('../utils/eventBus');
const { pool } = require('./scrapers/db'); // DB pool

const app = express();
app.use(cors());
app.use(express.json());

// Path to scraper runner
const runAllPath = path.resolve(__dirname, '../scrapers/run-all.js');

// Mock data routes (retain for UI)
const triggers = [
  { id: 1, name: 'Bus Acara (Event Bus)', type: 'Trigger', icon: 'hub', color: 'text-tertiary', border: 'border-t-primary/50' },
  { id: 2, name: 'Penjadwal (Scheduler)', type: 'Trigger', icon: 'schedule', color: 'text-tertiary', border: 'border-t-primary/50' },
  { id: 3, name: 'Webhook API', type: 'Trigger', icon: 'webhook', color: 'text-tertiary', border: 'border-t-primary/50' }
];

const actions = [
  { id: 101, name: 'API WhatsApp', type: 'Action', icon: 'chat', color: 'text-secondary', border: 'border-l-secondary' },
  { id: 102, name: 'Layanan Email', type: 'Action', icon: 'mail', color: 'text-primary', border: 'border-l-primary' },
  { id: 103, name: 'Gerbang Pembayaran', type: 'Action', icon: 'payments', color: 'text-green-400', border: 'border-l-green-400' },
  { id: 104, name: 'Integrasi ERP', type: 'Action', icon: 'database', color: 'text-tertiary', border: 'border-l-tertiary' }
];

app.get('/api/triggers', (req, res) => res.json(triggers));
app.get('/api/actions', (req, res) => res.json(actions));

app.post('/api/whatsapp/send', (req, res) => {
  console.log('Sending WhatsApp message', req.body);
  res.json({ status: 'sent', detail: req.body });
});

app.post('/api/email/send', (req, res) => {
  console.log('Sending Email', req.body);
  res.json({ status: 'sent', detail: req.body });
});

app.post('/api/payments/execute', (req, res) => {
  console.log('Executing payment', req.body);
  res.json({ status: 'executed', detail: req.body });
});

app.post('/api/erp/sync', (req, res) => {
  console.log('Syncing ERP data', req.body);
  res.json({ status: 'synced', detail: req.body });
});

// Manual trigger untuk scraper yang menulis hasil ke DB (handled in scraper)
app.post('/api/marketplace/scrape', (req, res) => {
  console.log('Manual scraper trigger received');
  const child = spawn('node', [runAllPath], { detached: true, stdio: 'ignore' });
  child.unref();
  res.json({ status: 'started', message: 'Scraper dijalankan di latar belakang' });
});

// Endpoint untuk tren intelijen (mengambil data produk terpopuler)
app.get('/api/intelligence/trends', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await pool.query(
      `SELECT * FROM marketplace_products ORDER BY sold_count DESC, rating DESC LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[API] Error fetching trends:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint laporan revenue (join orders + affiliate)
app.get('/api/revenue/report', async (req, res) => {
  try {
    const revenueResult = await pool.query(
      `SELECT SUM(o.price * o.quantity) AS total_revenue,
              COUNT(o.id) AS total_orders,
              SUM(a.commission) AS total_affiliate_commission
       FROM orders o
       LEFT JOIN affiliate a ON a.affiliate_id = o.marketplace`
    );
    res.json(revenueResult.rows[0] || {});
  } catch (err) {
    console.error('[API] Error fetching revenue report:', err);
    res.status(500).json({ error: err.message });
  }
});

// Integrasi routes order
const ordersRouter = require('./orders');
app.use('/api/orders', ordersRouter);

// Automation run endpoint
app.post('/api/automation/run', async (req, res) => {
  const { task } = req.body;
  try {
    const trigger = require('./automation/trigger');
    const result = await trigger.runTask(task);
    // Publish event after automation runs
    await publish('automation_executed', { task, result });
    res.json({ status: 'ok', task, result });
  } catch (err) {
    console.error('[API] Automation run error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.use(express.json());

// Sample data for triggers and actions (realistic mock data)
const triggers = [
  { id: 1, name: 'Bus Acara (Event Bus)', type: 'Trigger', icon: 'hub', color: 'text-tertiary', border: 'border-t-primary/50' },
  { id: 2, name: 'Penjadwal (Scheduler)', type: 'Trigger', icon: 'schedule', color: 'text-tertiary', border: 'border-t-primary/50' },
  { id: 3, name: 'Webhook API', type: 'Trigger', icon: 'webhook', color: 'text-tertiary', border: 'border-t-primary/50' }
];

const actions = [
  { id: 101, name: 'API WhatsApp', type: 'Action', icon: 'chat', color: 'text-secondary', border: 'border-l-secondary' },
  { id: 102, name: 'Layanan Email', type: 'Action', icon: 'mail', color: 'text-primary', border: 'border-l-primary' },
  { id: 103, name: 'Gerbang Pembayaran', type: 'Action', icon: 'payments', color: 'text-green-400', border: 'border-l-green-400' },
  { id: 104, name: 'Integrasi ERP', type: 'Action', icon: 'database', color: 'text-tertiary', border: 'border-l-tertiary' }
];

app.get('/api/triggers', (req, res) => {
  res.json(triggers);
});

app.get('/api/actions', (req, res) => {
  res.json(actions);
});

// Simulated endpoints for each action
app.post('/api/whatsapp/send', (req, res) => {
  console.log('Sending WhatsApp message', req.body);
  res.json({ status: 'sent', detail: req.body });
});

app.post('/api/email/send', (req, res) => {
  console.log('Sending Email', req.body);
  res.json({ status: 'sent', detail: req.body });
});

app.post('/api/payments/execute', (req, res) => {
  console.log('Executing payment', req.body);
  res.json({ status: 'executed', detail: req.body });
});

app.post('/api/erp/sync', (req, res) => {
  console.log('Syncing ERP data', req.body);
  res.json({ status: 'synced', detail: req.body });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
