const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, segment, search } = req.query;

    const query = { createdBy: userId };
    if (segment) query['crmData.segment'] = segment;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
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

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.userId
    }).populate('orders');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      createdBy: req.userId
    };

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({ customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer segment
router.put('/:id/segment', async (req, res) => {
  try {
    const { segment } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { 'crmData.segment': segment },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer orders
router.get('/:id/orders', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const query = { createdBy: req.userId };
    if (customer.email) {
      query['customer.email'] = customer.email;
    } else if (customer.phone) {
      query['customer.phone'] = customer.phone;
    } else {
      return res.json({ orders: [] });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CRM analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    const userId = req.userId;

    const [
      totalCustomers,
      segmentCounts,
      totalLifetimeValue,
      averageOrderValue,
      churnRiskCustomers
    ] = await Promise.all([
      Customer.countDocuments({ createdBy: userId }),
      Customer.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$crmData.segment', count: { $sum: 1 } } }
      ]),
      Customer.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: null, total: { $sum: '$crmData.lifetimeValue' } } }
      ]),
      Customer.aggregate([
        { $match: { createdBy: userId, 'crmData.totalOrders': { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$crmData.averageOrderValue' } } }
      ]),
      Customer.countDocuments({
        createdBy: userId,
        'aiInsights.churnRisk': { $gte: 70 }
      })
    ]);

    const lifetimeValue = totalLifetimeValue[0]?.total || 0;
    const avgOrderValue = averageOrderValue[0]?.avg || 0;

    const segments = {
      new: 0,
      occasional: 0,
      regular: 0,
      vip: 0,
      churned: 0
    };

    segmentCounts.forEach(seg => {
      if (segments.hasOwnProperty(seg._id)) {
        segments[seg._id] = seg.count;
      }
    });

    res.json({
      analytics: {
        totalCustomers,
        segments,
        totalLifetimeValue: lifetimeValue,
        averageOrderValue: avgOrderValue,
        churnRiskCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add customer note
router.post('/:id/notes', async (req, res) => {
  try {
    const { note } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { $push: { notes: note } },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send marketing campaign
router.post('/campaign', async (req, res) => {
  try {
    const { segment, subject, message, channels } = req.body;

    const customers = await Customer.find({
      createdBy: req.userId,
      'crmData.segment': segment
    });

    const { sendBulkNotification } = require('../services/notificationService');
    const results = await sendBulkNotification(
      customers.map(c => c._id),
      { type: 'marketing', title: subject, message },
      channels
    );

    res.json({ message: 'Campaign sent successfully', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
