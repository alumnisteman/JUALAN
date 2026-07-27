const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status, marketplace, startDate, endDate } = req.query;

    const query = { createdBy: userId };
    if (status) query.status = status;
    if (marketplace) query['marketplace.platform'] = marketplace;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name sku images')
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

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      createdBy: req.userId
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const orderData = {
      ...req.body,
      createdBy: req.userId
    };

    // Check inventory availability and reserve atomically
    for (const item of orderData.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ error: `Product ${item.product} not found` });
      }
      
      if (product.inventory.available < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.inventory.available}, Requested: ${item.quantity}`
        });
      }

      // Reserve inventory
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { 'inventory.reserved': item.quantity } },
        { session }
      );
    }

    const order = new Order(orderData);
    await order.save({ session });

    await session.commitTransaction();

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('order:created', order);

    res.status(201).json({ order });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { status } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      createdBy: req.userId
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;

    // Handle inventory based on status
    if (status === 'cancelled') {
      // Release reserved inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { 'inventory.reserved': -item.quantity } },
          { session }
        );
      }
    } else if (status === 'shipped') {
      // Deduct actual inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { 
            $inc: { 
              'inventory.quantity': -item.quantity,
              'inventory.reserved': -item.quantity
            }
          },
          { session }
        );
      }
      order.fulfillment.shippedAt = new Date();
    } else if (status === 'completed') {
      order.fulfillment.status = 'completed';
      order.payment.status = 'paid';
      order.paidAt = new Date();
    }

    await order.save({ session });
    await session.commitTransaction();

    const io = req.app.get('io');
    io.to(`user-${req.userId}`).emit('order:status-updated', order);

    res.json({ order });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Update shipping information
router.put('/:id/shipping', async (req, res) => {
  try {
    const { carrier, trackingNumber, status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      {
        'shipping.carrier': carrier,
        'shipping.trackingNumber': trackingNumber,
        'shipping.status': status || 'in_transit'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add shipping checkpoint
router.post('/:id/checkpoint', async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.shipping.checkpoints.push({
      status,
      location,
      timestamp: new Date(),
      description
    });

    await order.save();

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
