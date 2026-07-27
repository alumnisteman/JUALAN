const cron = require('node-cron');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { runAutoPricing, runAutoContent, runInventorySync, runOrderSync } = require('./automationService');

const startAutomationScheduler = () => {
  console.log('Starting automation scheduler...');

  // Run auto-pricing every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running auto-pricing automation...');
    try {
      const users = await User.find({ 'aiSettings.autoPricing': true, isActive: true });
      for (const user of users) {
        await runAutoPricing(user._id);
      }
    } catch (error) {
      console.error('Auto-pricing error:', error);
    }
  });

  // Run auto-content daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running auto-content automation...');
    try {
      const users = await User.find({ 'aiSettings.autoContent': true, isActive: true });
      for (const user of users) {
        await runAutoContent(user._id);
      }
    } catch (error) {
      console.error('Auto-content error:', error);
    }
  });

  // Run inventory sync every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running inventory sync automation...');
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        await runInventorySync(user._id);
      }
    } catch (error) {
      console.error('Inventory sync error:', error);
    }
  });

  // Run order sync every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running order sync automation...');
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        await runOrderSync(user._id);
      }
    } catch (error) {
      console.error('Order sync error:', error);
    }
  });

  // Check low stock every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('Checking low stock products...');
    try {
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$inventory.available', '$inventory.reorderLevel'] }
      }).populate('createdBy');

      const { sendBulkNotification } = require('./notificationService');
      const userIds = [...new Set(lowStockProducts.map(p => p.createdBy._id.toString()))];
      
      for (const userId of userIds) {
        const userProducts = lowStockProducts.filter(p => p.createdBy._id.toString() === userId);
        await sendBulkNotification([userId], {
          type: 'inventory',
          title: 'Low Stock Alert',
          message: `${userProducts.length} products are running low on stock`
        }, ['push', 'email']);
      }
    } catch (error) {
      console.error('Low stock check error:', error);
    }
  });

  console.log('Automation scheduler started successfully');
};

module.exports = { startAutomationScheduler };
