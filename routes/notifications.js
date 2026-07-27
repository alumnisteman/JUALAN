const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Get notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, unreadOnly } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read', count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send notification
router.post('/send', async (req, res) => {
  try {
    const { type, title, message, data, channels } = req.body;

    const user = await User.findById(req.userId).select('notificationSettings');

    const notif = await Notification.create({
      userId: req.userId,
      type,
      title,
      message,
      data: data || {},
      channels: channels || ['push']
    });

    // Send via configured channels
    const { sendNotification } = require('../services/notificationService');
    await sendNotification(req.userId, notif, channels || ['push'], user.notificationSettings);

    // Emit via WebSocket
    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('notification:new', notif);

    res.status(201).json({ notification: notif });
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
