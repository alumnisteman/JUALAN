const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');

const router = express.Router();

// Get all automations
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User');
    const user = await User.findById(userId).select('aiSettings');

    const automations = [
      {
        id: 'auto-pricing',
        name: 'Dynamic Pricing',
        description: 'Automatically adjust prices based on market demand and competition',
        enabled: user.aiSettings.autoPricing,
        schedule: 'Every 6 hours',
        lastRun: new Date(Date.now() - 21600000),
        nextRun: new Date(Date.now() + 21600000),
        status: user.aiSettings.autoPricing ? 'active' : 'inactive'
      },
      {
        id: 'auto-content',
        name: 'AI Content Generation',
        description: 'Generate product descriptions and marketing content automatically',
        enabled: user.aiSettings.autoContent,
        schedule: 'Daily at 00:00',
        lastRun: new Date(Date.now() - 86400000),
        nextRun: new Date(Date.now() + 86400000),
        status: user.aiSettings.autoContent ? 'active' : 'inactive'
      },
      {
        id: 'auto-reply',
        name: 'AI Auto-Reply',
        description: 'Automatically respond to customer messages',
        enabled: user.aiSettings.autoReply,
        schedule: 'Real-time',
        lastRun: new Date(),
        nextRun: null,
        status: user.aiSettings.autoReply ? 'active' : 'inactive'
      },
      {
        id: 'inventory-sync',
        name: 'Inventory Sync',
        description: 'Sync inventory across all marketplaces',
        enabled: true,
        schedule: 'Every hour',
        lastRun: new Date(Date.now() - 3600000),
        nextRun: new Date(Date.now() + 3600000),
        status: 'active'
      },
      {
        id: 'order-sync',
        name: 'Order Sync',
        description: 'Sync orders from all marketplaces',
        enabled: true,
        schedule: 'Every 15 minutes',
        lastRun: new Date(Date.now() - 900000),
        nextRun: new Date(Date.now() + 900000),
        status: 'active'
      }
    ];

    res.json({ automations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle automation
router.put('/:automationId/toggle', async (req, res) => {
  try {
    const { automationId } = req.params;
    const { enabled } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.userId);

    const fieldMap = {
      'auto-pricing': 'aiSettings.autoPricing',
      'auto-content': 'aiSettings.autoContent',
      'auto-reply': 'aiSettings.autoReply'
    };

    const field = fieldMap[automationId];
    if (field) {
      const fieldPath = field.split('.');
      user[fieldPath[0]][fieldPath[1]] = enabled;
      await user.save();
    }

    res.json({ message: 'Automation updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run automation manually
router.post('/:automationId/run', async (req, res) => {
  try {
    const { automationId } = req.params;

    const {
      runAutoPricing,
      runAutoContent,
      runInventorySync,
      runOrderSync
    } = require('../services/automationService');

    let result;
    switch (automationId) {
      case 'auto-pricing':
        result = await runAutoPricing(req.userId);
        break;
      case 'auto-content':
        result = await runAutoContent(req.userId);
        break;
      case 'inventory-sync':
        result = await runInventorySync(req.userId);
        break;
      case 'order-sync':
        result = await runOrderSync(req.userId);
        break;
      default:
        return res.status(400).json({ error: 'Unknown automation' });
    }

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('automation:completed', { automationId, result });

    res.json({ message: 'Automation completed successfully', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation history
router.get('/:automationId/history', async (req, res) => {
  try {
    const { automationId } = req.params;
    const { limit = 20 } = req.query;

    // This would typically use an AutomationLog model
    // For now, return placeholder data
    const history = [
      {
        runAt: new Date(Date.now() - 3600000),
        status: 'success',
        duration: 45,
        itemsProcessed: 150
      },
      {
        runAt: new Date(Date.now() - 7200000),
        status: 'success',
        duration: 52,
        itemsProcessed: 148
      }
    ];

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create custom automation
router.post('/custom', async (req, res) => {
  try {
    const { name, description, trigger, actions, schedule } = req.body;

    // This would save to an Automation model
    const automation = {
      id: `custom-${Date.now()}`,
      name,
      description,
      trigger,
      actions,
      schedule,
      createdBy: req.userId,
      createdAt: new Date(),
      enabled: true
    };

    res.status(201).json({ automation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
