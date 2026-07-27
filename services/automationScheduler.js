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
        try {
          await runAutoPricing(user._id);
        } catch (error) {
          console.error(`Auto-pricing failed for user ${user._id}:`, error);
          // Log error dan send notification to user
          const { sendNotification } = require('./notificationService');
          await sendNotification(user._id, {
            type: 'automation',
            title: 'Auto-pricing Failed',
            message: 'Automatic pricing update failed. Please check your settings.'
          }, ['push', 'email']);
        }
      }
    } catch (error) {
      console.error('Auto-pricing scheduler error:', error);
    }
  });

  // Run auto-content daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running auto-content automation...');
    try {
      const users = await User.find({ 'aiSettings.autoContent': true, isActive: true });
      for (const user of users) {
        try {
          await runAutoContent(user._id);
        } catch (error) {
          console.error(`Auto-content failed for user ${user._id}:`, error);
          const { sendNotification } = require('./notificationService');
          await sendNotification(user._id, {
            type: 'automation',
            title: 'Auto-content Failed',
            message: 'Automatic content generation failed. Please check your settings.'
          }, ['push', 'email']);
        }
      }
    } catch (error) {
      console.error('Auto-content scheduler error:', error);
    }
  });

  // Run inventory sync every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running inventory sync automation...');
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        try {
          await runInventorySync(user._id);
        } catch (error) {
          console.error(`Inventory sync failed for user ${user._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Inventory sync scheduler error:', error);
    }
  });

  // Run order sync every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running order sync automation...');
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        try {
          await runOrderSync(user._id);
        } catch (error) {
          console.error(`Order sync failed for user ${user._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Order sync scheduler error:', error);
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
        try {
          const userProducts = lowStockProducts.filter(p => p.createdBy._id.toString() === userId);
          await sendBulkNotification([userId], {
            type: 'inventory',
            title: 'Low Stock Alert',
            message: `${userProducts.length} products are running low on stock`
          }, ['push', 'email']);
        } catch (error) {
          console.error(`Failed to send low stock notification to user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error('Low stock check error:', error);
    }
  });

  console.log('Automation scheduler started successfully');
};

module.exports = { startAutomationScheduler };
