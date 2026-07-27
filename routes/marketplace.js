const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Product = require('../models/Product');

const router = express.Router();

// Get marketplace integrations
router.get('/integrations', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('marketplaceIntegrations');
    res.json({ integrations: user.marketplaceIntegrations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect marketplace
router.post('/connect', async (req, res) => {
  try {
    const { platform, shopId, accessToken, refreshToken } = req.body;

    // Validation
    if (!platform || !['shopee', 'tokopedia', 'tiktok', 'zalora'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const user = await User.findById(req.userId);
    
    const existingIntegration = user.marketplaceIntegrations.find(
      m => m.platform === platform
    );

    if (existingIntegration) {
      existingIntegration.shopId = shopId;
      existingIntegration.accessToken = accessToken;
      existingIntegration.refreshToken = refreshToken;
      existingIntegration.isConnected = true;
      existingIntegration.lastSync = new Date();
    } else {
      user.marketplaceIntegrations.push({
        platform,
        shopId,
        accessToken,
        refreshToken,
        isConnected: true,
        lastSync: new Date()
      });
    }

    await user.save();

    // Trigger initial sync
    const { syncMarketplace } = require('../services/marketplaceSync');
    await syncMarketplace(platform, user._id);

    res.json({ message: 'Marketplace connected successfully', integrations: user.marketplaceIntegrations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect marketplace
router.delete('/disconnect/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    const user = await User.findById(req.userId);
    user.marketplaceIntegrations = user.marketplaceIntegrations.filter(
      m => m.platform !== platform
    );
    await user.save();

    res.json({ message: 'Marketplace disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync marketplace data
router.post('/sync/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { syncType = 'full' } = req.body;

    const user = await User.findById(req.userId);
    const integration = user.marketplaceIntegrations.find(m => m.platform === platform);

    if (!integration || !integration.isConnected) {
      return res.status(400).json({ error: 'Marketplace not connected' });
    }

    const { syncMarketplace } = require('../services/marketplaceSync');
    const syncResult = await syncMarketplace(platform, req.userId, syncType);

    integration.lastSync = new Date();
    await user.save();

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('marketplace:synced', { platform, syncResult });

    res.json({ message: 'Sync completed successfully', syncResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get marketplace orders
router.get('/:platform/orders', async (req, res) => {
  try {
    const { platform } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const Order = require('../models/Order');
    const query = {
      createdBy: req.userId,
      'marketplace.platform': platform
    };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get marketplace products
router.get('/:platform/products', async (req, res) => {
  try {
    const { platform } = req.params;

    const products = await Product.find({
      createdBy: req.userId,
      'marketplaceListings.platform': platform,
      'marketplaceListings.isActive': true
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for marketplace events
router.post('/webhook/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const event = req.body;

    // Verify webhook signature (platform-specific)
    const signature = req.headers['x-webhook-signature'];
    
    if (signature) {
      const webhookSecret = process.env[`${platform.toUpperCase()}_WEBHOOK_SECRET`];
      if (webhookSecret) {
        const hmac = crypto.createHmac('sha256', webhookSecret);
        hmac.update(JSON.stringify(req.body));
        const expectedSignature = hmac.digest('hex');
        
        if (signature !== expectedSignature) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
      }
    }

    const { handleWebhook } = require('../services/marketplaceSync');
    await handleWebhook(platform, event);

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
