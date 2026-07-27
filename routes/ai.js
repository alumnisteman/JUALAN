const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

const router = express.Router();

// AI Product Analysis
router.post('/analyze-product', async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findOne({
      _id: productId,
      createdBy: req.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Use AI service for analysis
    const { analyzeProduct } = require('../services/aiService');
    const analysis = await analyzeProduct(product);

    product.aiData = {
      ...product.aiData,
      ...analysis,
      lastAnalysis: new Date()
    };
    await product.save();

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Price Recommendation
router.post('/recommend-price', async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findOne({
      _id: productId,
      createdBy: req.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { recommendPrice } = require('../services/aiService');
    const recommendation = await recommendPrice(product);

    res.json({ recommendation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Content Generation
router.post('/generate-content', async (req, res) => {
  try {
    const { productId, contentType } = req.body;
    const product = await Product.findOne({
      _id: productId,
      createdBy: req.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { generateContent } = require('../services/aiService');
    const content = await generateContent(product, contentType);

    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Customer Insights
router.post('/analyze-customer', async (req, res) => {
  try {
    const { customerId } = req.body;
    const customer = await Customer.findOne({
      _id: customerId,
      createdBy: req.userId
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { analyzeCustomer } = require('../services/aiService');
    const insights = await analyzeCustomer(customer);

    customer.aiInsights = {
      ...customer.aiInsights,
      ...insights
    };
    await customer.save();

    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Trend Analysis
router.get('/trends', async (req, res) => {
  try {
    const { category, timeframe = '30' } = req.query;
    const days = parseInt(timeframe);

    const { analyzeTrends } = require('../services/aiService');
    const trends = await analyzeTrends(req.userId, category, days);

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Fraud Detection
router.post('/detect-fraud', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({
      _id: orderId,
      createdBy: req.userId
    }).populate('customer');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { detectFraud } = require('../services/aiService');
    const fraudAnalysis = await detectFraud(order);

    order.aiInsights = {
      ...order.aiInsights,
      fraudRisk: fraudAnalysis.riskScore
    };
    await order.save();

    res.json({ fraudAnalysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Product Hunting
router.get('/product-hunting', async (req, res) => {
  try {
    const { category, budget, minMargin } = req.query;

    const { huntProducts } = require('../services/aiService');
    const recommendations = await huntProducts(req.userId, {
      category,
      budget: budget ? parseFloat(budget) : null,
      minMargin: minMargin ? parseFloat(minMargin) : null
    });

    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Auto-Reply Configuration
router.put('/auto-reply/config', async (req, res) => {
  try {
    const { enabled, responses, rules } = req.body;

    const User = require('../models/User');
    await User.findByIdAndUpdate(req.userId, {
      'aiSettings.autoReply': enabled,
      'aiSettings.autoReplyConfig': { responses, rules }
    });

    res.json({ message: 'Auto-reply configuration updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
