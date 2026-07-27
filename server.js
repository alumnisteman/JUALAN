require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

// Import models (ensure Counter registered before Order, Notification early)
require('./models/Counter');
require('./models/Notification');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const aiRoutes = require('./routes/ai');
const marketplaceRoutes = require('./routes/marketplace');
const automationRoutes = require('./routes/automation');
const notificationRoutes = require('./routes/notifications');
const crmRoutes = require('./routes/crm');
const pricingRoutes = require('./routes/pricing');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Import services
const { startAutomationScheduler } = require('./services/automationScheduler');
const { initializeWebSocket } = require('./services/websocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make io accessible to routes
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/marketplace', authMiddleware, marketplaceRoutes);
app.use('/api/automation', authMiddleware, automationRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/crm', authMiddleware, crmRoutes);
app.use('/api/pricing', authMiddleware, pricingRoutes);

// Serve static files from UI modules (only if directory exists)
const fs = require('fs');
const path = require('path');

const uiModules = [
  'resellerhub_dashboard',
  'resellerhub_os',
  'resellerhub_ai_content_hub',
  'resellerhub_ai_marketing_hub',
  'resellerhub_ai_order_fulfillment',
  'resellerhub_ai_pricing_engine',
  'resellerhub_analitik_ai',
  'resellerhub_auto_posting',
  'resellerhub_auto_reply_ai',
  'resellerhub_automasi_marketing_ai',
  'resellerhub_integrasi_supplier',
  'resellerhub_inventory_sync',
  'resellerhub_manajemen_stok_otomatis',
  'resellerhub_manajemen_pelanggan_crm',
  'resellerhub_pengaturan_profil_toko',
  'otorisasi_api_berhasil_terhubung',
  'otorisasi_api_izin_akses',
  'otorisasi_api_pilih_marketplace',
  'otorisasi_api_sinkronisasi_awal'
];

uiModules.forEach(module => {
  const modulePath = path.join(__dirname, module);
  if (fs.existsSync(modulePath)) {
    app.use(express.static(module));
  }
});

// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resellerhub')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Initialize WebSocket
initializeWebSocket(io);

// Start automation scheduler
startAutomationScheduler();

// Scheduled tasks
cron.schedule('0 * * * *', () => {
  console.log('Running hourly sync tasks...');
  // Hourly sync tasks
});

cron.schedule('0 0 * * *', () => {
  console.log('Running daily analytics...');
  // Daily analytics tasks
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
