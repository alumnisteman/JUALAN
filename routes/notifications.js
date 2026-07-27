const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, unreadOnly } = req.query;

    // This would typically use a Notification model
    // For now, return placeholder data
    const notifications = [
      {
        id: '1',
        type: 'order',
        title: 'New Order Received',
        message: 'Order ORD-2024001 has been received from Shopee',
        data: { orderId: 'ORD-2024001', platform: 'shopee' },
        read: false,
        createdAt: new Date(Date.now() - 300000)
      },
      {
        id: '2',
        type: 'inventory',
        title: 'Low Stock Alert',
        message: 'Product SKU-001 is running low on stock',
        data: { productId: 'product-id', sku: 'SKU-001', available: 5 },
        read: false,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        type: 'ai',
        title: 'AI Insight',
        message: 'Demand for ergonomic peripherals is projected to rise by 22%',
        data: { category: 'ergonomic-peripherals', increase: 22 },
        read: true,
        createdAt: new Date(Date.now() - 86400000)
      }
    ];

    let filtered = notifications;
    if (unreadOnly === 'true') {
      filtered = notifications.filter(n => !n.read);
    }

    res.json({ 
      notifications: filtered.slice(0, parseInt(limit)),
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    // This would update in Notification model
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    // This would update all notifications for user
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send notification
router.post('/send', async (req, res) => {
  try {
    const { type, title, message, data, channels } = req.body;

    const user = await User.findById(req.userId).select('notificationSettings');
    
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date()
    };

    // Send via configured channels
    const { sendNotification } = require('../services/notificationService');
    await sendNotification(req.userId, notification, channels || ['push'], user.notificationSettings);

    // Emit via WebSocket
    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('notification:new', notification);

    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification settings
router.get('/settings', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notificationSettings');
    res.json({ settings: user.notificationSettings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification settings
router.put('/settings', async (req, res) => {
  try {
    const { email, whatsapp, telegram, push } = req.body;

    await User.findByIdAndUpdate(req.userId, {
      notificationSettings: { email, whatsapp, telegram, push }
    });

    res.json({ message: 'Notification settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
