const express = require('express');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, category, status, search } = req.query;

    const query = { createdBy: userId };
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('inventory.supplierId', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
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

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.userId
    }).populate('inventory.supplierId');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.userId
    };

    const product = new Product(productData);
    await product.save();

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('product:created', product);

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('product:updated', product);

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('product:deleted', product._id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync product to marketplace
router.post('/:id/sync/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add or update marketplace listing
    const existingListing = product.marketplaceListings.find(
      listing => listing.platform === platform
    );

    if (existingListing) {
      existingListing.lastSync = new Date();
    } else {
      product.marketplaceListings.push({
        platform,
        isActive: true,
        lastSync: new Date()
      });
    }

    await product.save();

    // Trigger actual marketplace sync via service
    const { syncToMarketplace } = require('../services/marketplaceSync');
    await syncToMarketplace(product, platform, req.userId);

    res.json({ message: 'Product synced successfully', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update products
router.post('/bulk/update', async (req, res) => {
  try {
    const { updates, productIds } = req.body;

    const products = await Product.updateMany(
      { _id: { $in: productIds }, createdBy: req.userId },
      { $set: updates }
    );

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('products:bulk-updated', { productIds, updates });

    res.json({ message: 'Products updated successfully', count: products.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
