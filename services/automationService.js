const Product = require('../models/Product');
const Order = require('../models/Order');
const { recommendPrice, generateContent } = require('./aiService');
const { syncMarketplace } = require('./marketplaceSync');

// Run auto-pricing automation
async function runAutoPricing(userId) {
  try {
    const products = await Product.find({
      createdBy: userId,
      status: 'active',
      'aiData.recommendedPrice': { $exists: true }
    });

    const results = {
      total: products.length,
      updated: 0,
      skipped: 0
    };

    for (const product of products) {
      const recommendation = await recommendPrice(product);
      
      // Only update if difference is significant (>5%)
      const differencePercent = Math.abs(
        (recommendation.recommendedPrice - product.pricing.sellingPrice) / product.pricing.sellingPrice * 100
      );

      if (differencePercent > 5) {
        product.pricing.sellingPrice = recommendation.recommendedPrice;
        await product.save();
        results.updated++;
      } else {
        results.skipped++;
      }
    }

    return results;
  } catch (error) {
    console.error('Auto-pricing error:', error);
    throw error;
  }
}

// Run auto-content automation
async function runAutoContent(userId) {
  try {
    const products = await Product.find({
      createdBy: userId,
      status: 'active',
      $or: [
        { description: { $exists: false } },
        { description: '' },
        { description: { $regex: /^placeholder/i } }
      ]
    });

    const results = {
      total: products.length,
      generated: 0,
      failed: 0
    };

    for (const product of products) {
      try {
        const content = await generateContent(product, 'description');
        product.description = content.content;
        await product.save();
        results.generated++;
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  } catch (error) {
    console.error('Auto-content error:', error);
    throw error;
  }
}

// Run inventory sync automation
async function runInventorySync(userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    const results = {
      platforms: [],
      totalSynced: 0
    };

    for (const integration of user.marketplaceIntegrations) {
      if (integration.isConnected) {
        try {
          const syncResult = await syncMarketplace(integration.platform, userId, 'inventory');
          results.platforms.push({
            platform: integration.platform,
            success: true,
            ...syncResult
          });
          results.totalSynced++;
        } catch (error) {
          results.platforms.push({
            platform: integration.platform,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Inventory sync error:', error);
    throw error;
  }
}

// Run order sync automation
async function runOrderSync(userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    const results = {
      platforms: [],
      totalOrders: 0,
      newOrders: 0
    };

    for (const integration of user.marketplaceIntegrations) {
      if (integration.isConnected) {
        try {
          const syncResult = await syncMarketplace(integration.platform, userId, 'orders');
          results.platforms.push({
            platform: integration.platform,
            success: true,
            ...syncResult
          });
          results.totalOrders += syncResult.ordersSynced || 0;
          results.newOrders += syncResult.newOrders || 0;
        } catch (error) {
          results.platforms.push({
            platform: integration.platform,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Order sync error:', error);
    throw error;
  }
}

module.exports = {
  runAutoPricing,
  runAutoContent,
  runInventorySync,
  runOrderSync
};
