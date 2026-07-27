const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalCustomers,
      lowStockProducts
    ] = await Promise.all([
      Product.countDocuments({ createdBy: userId }),
      Product.countDocuments({ createdBy: userId, status: 'active' }),
      Order.countDocuments({ createdBy: userId }),
      Order.countDocuments({ createdBy: userId, status: 'pending' }),
      Order.countDocuments({ createdBy: userId, status: 'completed' }),
      Order.aggregate([
        { $match: { createdBy: userId, status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Customer.countDocuments({ createdBy: userId }),
      Product.countDocuments({
        createdBy: userId,
        'inventory.available': { $lte: '$inventory.reorderLevel' }
      })
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    // Calculate average order value
    const avgOrderValue = completedOrders > 0 ? revenue / completedOrders : 0;

    // Get recent orders
    const recentOrders = await Order.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product', 'name sku images');

    // Get top selling products
    const topProducts = await Order.aggregate([
      { $match: { createdBy: userId, status: { $in: ['delivered', 'completed'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' }
    ]);

    res.json({
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: revenue,
        totalCustomers,
        lowStockProducts,
        avgOrderValue
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue trends
router.get('/revenue-trends', async (req, res) => {
  try {
    const userId = req.userId;
    const { period = '30' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Order.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ['delivered', 'completed'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation status
router.get('/automation-status', async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('aiSettings marketplaceIntegrations');

    const automationTasks = [
      {
        name: 'Supplier Sync',
        status: user.marketplaceIntegrations.some(m => m.isConnected) ? 'active' : 'inactive',
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 3600000)
      },
      {
        name: 'Auto Pricing',
        status: user.aiSettings.autoPricing ? 'active' : 'inactive',
        lastRun: new Date(Date.now() - 7200000),
        nextRun: new Date(Date.now() + 1800000)
      },
      {
        name: 'Auto Content',
        status: user.aiSettings.autoContent ? 'active' : 'inactive',
        lastRun: new Date(Date.now() - 86400000),
        nextRun: new Date(Date.now() + 43200000)
      },
      {
        name: 'Auto Reply',
        status: user.aiSettings.autoReply ? 'active' : 'inactive',
        lastRun: new Date(),
        nextRun: null
      }
    ];

    res.json({ automationTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
