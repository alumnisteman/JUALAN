const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// Get pricing overview
router.get('/overview', async (req, res) => {
  try {
    const userId = req.userId;

    const products = await Product.find({ createdBy: userId, status: 'active' });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const productMargins = [];

    products.forEach(product => {
      const revenue = product.pricing.sellingPrice * product.inventory.quantity;
      const cost = product.pricing.costPrice * product.inventory.quantity;
      const profit = revenue - cost;
      const margin = product.pricing.sellingPrice > 0 
        ? ((product.pricing.sellingPrice - product.pricing.costPrice) / product.pricing.sellingPrice) * 100 
        : 0;

      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;

      productMargins.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        costPrice: product.pricing.costPrice,
        sellingPrice: product.pricing.sellingPrice,
        margin,
        profit
      });
    });

    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    res.json({
      overview: {
        totalRevenue,
        totalCost,
        totalProfit,
        averageMargin,
        totalProducts: products.length
      },
      productMargins: productMargins.sort((a, b) => b.margin - a.margin).slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product price
router.put('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { costPrice, sellingPrice, discountPrice } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: productId, createdBy: req.userId },
      {
        'pricing.costPrice': costPrice,
        'pricing.sellingPrice': sellingPrice,
        'pricing.discountPrice': discountPrice
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Sync price to marketplaces if enabled
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    if (user.aiSettings.autoPricing) {
      const { syncPriceToMarketplaces } = require('../services/pricingService');
      await syncPriceToMarketplaces(product, req.userId);
    }

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('price:updated', product);

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk price update
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates, productIds, strategy } = req.body;

    let updateQuery = {};
    if (strategy === 'percentage') {
      const { percentage, type } = updates;
      const multiplier = type === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);
      updateQuery = {
        $mul: { 'pricing.sellingPrice': multiplier }
      };
    } else if (strategy === 'fixed') {
      const { amount, type } = updates;
      const increment = type === 'increase' ? amount : -amount;
      updateQuery = {
        $inc: { 'pricing.sellingPrice': increment }
      };
    } else {
      updateQuery = { $set: updates };
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds }, createdBy: req.userId },
      updateQuery
    );

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('prices:bulk-updated', { productIds, updates });

    res.json({ message: 'Prices updated successfully', count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get price recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.userId;

    const products = await Product.find({
      createdBy: userId,
      status: 'active',
      'aiData.recommendedPrice': { $exists: true }
    }).select('name sku pricing aiData');

    const recommendations = products.map(product => ({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      currentPrice: product.pricing.sellingPrice,
      recommendedPrice: product.aiData.recommendedPrice,
      difference: product.aiData.recommendedPrice - product.pricing.sellingPrice,
      differencePercent: ((product.aiData.recommendedPrice - product.pricing.sellingPrice) / product.pricing.sellingPrice) * 100,
      demandScore: product.aiData.demandScore,
      competitionLevel: product.aiData.competitionLevel
    }));

    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply price recommendation
router.post('/apply-recommendation/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      createdBy: req.userId
    });

    if (!product || !product.aiData.recommendedPrice) {
      return res.status(404).json({ error: 'Product or recommendation not found' });
    }

    product.pricing.sellingPrice = product.aiData.recommendedPrice;
    await product.save();

    // Sync to marketplaces
    const { syncPriceToMarketplaces } = require('../services/pricingService');
    await syncPriceToMarketplaces(product, req.userId);

    res.json({ message: 'Price recommendation applied', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pricing rules
router.get('/rules', async (req, res) => {
  try {
    // This would typically use a PricingRule model
    const rules = [
      {
        id: '1',
        name: 'Minimum Margin Rule',
        description: 'Ensure minimum 20% profit margin',
        type: 'margin',
        value: 20,
        enabled: true
      },
      {
        id: '2',
        name: 'Competitor Match',
        description: 'Match competitor prices within 5%',
        type: 'competitor',
        value: 5,
        enabled: false
      },
      {
        id: '3',
        name: 'Demand-Based Pricing',
        description: 'Increase price when demand is high',
        type: 'demand',
        value: 10,
        enabled: true
      }
    ];

    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create pricing rule
router.post('/rules', async (req, res) => {
  try {
    const { name, description, type, value, enabled } = req.body;

    const rule = {
      id: Date.now().toString(),
      name,
      description,
      type,
      value,
      enabled: enabled !== false,
      createdBy: req.userId,
      createdAt: new Date()
    };

    res.status(201).json({ rule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
