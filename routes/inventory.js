const express = require('express');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const router = express.Router();

// Get inventory overview
router.get('/overview', async (req, res) => {
  try {
    const userId = req.userId;

    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
      suppliers
    ] = await Promise.all([
      Product.countDocuments({ createdBy: userId }),
      Product.countDocuments({
        createdBy: userId,
        $expr: { $lte: ['$inventory.available', '$inventory.reorderLevel'] }
      }),
      Product.countDocuments({
        createdBy: userId,
        'inventory.available': 0
      }),
      Product.aggregate([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$inventory.quantity', '$pricing.costPrice'] } }
          }
        }
      ]),
      Supplier.find({ createdBy: userId }).select('name code performance')
    ]);

    const inventoryValue = totalInventoryValue[0]?.totalValue || 0;

    // Get low stock products details
    const lowStockDetails = await Product.find({
      createdBy: userId,
      $expr: { $lte: ['$inventory.available', '$inventory.reorderLevel'] }
    }).select('name sku inventory pricing').limit(10);

    res.json({
      overview: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue: inventoryValue,
        suppliersCount: suppliers.length
      },
      lowStockDetails,
      suppliers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory movements
router.get('/movements', async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, type, startDate, endDate } = req.query;

    // This would typically use an InventoryMovement model
    // For now, return placeholder data
    const movements = [
      {
        type: 'in',
        quantity: 50,
        productId: 'example-id',
        productName: 'Example Product',
        timestamp: new Date(),
        reference: 'PO-001'
      }
    ];

    res.json({ movements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adjust inventory
router.post('/adjust', async (req, res) => {
  try {
    const { productId, quantity, type, reason, reference } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }
    if (!type || !['in', 'out'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "in" or "out"' });
    }

    const product = await Product.findOne({
      _id: productId,
      createdBy: req.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const adjustment = type === 'in' ? quantity : -quantity;
    const newQuantity = product.inventory.quantity + adjustment;

    if (newQuantity < 0) {
      return res.status(400).json({ 
        error: 'Insufficient quantity for adjustment. Current: ' + product.inventory.quantity + ', Requested: ' + adjustment
      });
    }

    product.inventory.quantity = newQuantity;
    product.inventory.available = product.inventory.quantity - product.inventory.reserved;

    await product.save();

    // Log inventory movement (would use InventoryMovement model)
    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('inventory:adjusted', {
      productId,
      adjustment,
      newQuantity: product.inventory.quantity,
      reason
    });

    res.json({ 
      message: 'Inventory adjusted successfully',
      product 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync inventory with supplier
router.post('/sync/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findOne({
      _id: supplierId,
      createdBy: req.userId
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Trigger supplier sync via service
    const { syncSupplierInventory } = require('../services/supplierSync');
    const syncResult = await syncSupplierInventory(supplier, req.userId);

    res.json({ 
      message: 'Inventory synced successfully',
      syncResult 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predictive restock recommendations
router.get('/restock-recommendations', async (req, res) => {
  try {
    const userId = req.userId;

    const recommendations = await Product.aggregate([
      { $match: { createdBy: userId, status: 'active' } },
      {
        $addFields: {
          daysUntilStockout: {
            $cond: [
              { $gt: ['$inventory.available', 0] },
              { $divide: ['$inventory.available', { $max: [1, { $multiply: ['$aiData.demandScore', 0.1] }] }] },
              0
            ]
          }
        }
      },
      {
        $match: {
          daysUntilStockout: { $lte: 7 } // Recommend if stock will run out in 7 days
        }
      },
      {
        $project: {
          name: 1,
          sku: 1,
          inventory: 1,
          pricing: 1,
          aiData: 1,
          daysUntilStockout: 1,
          recommendedOrderQuantity: {
            $multiply: [{ $multiply: ['$aiData.demandScore', 0.1] }, 30] // 30 days supply
          }
        }
      },
      { $sort: { daysUntilStockout: 1 } },
      { $limit: 20 }
    ]);

    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
