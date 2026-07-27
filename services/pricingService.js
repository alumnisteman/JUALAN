const Product = require('../models/Product');
const { syncToMarketplace } = require('./marketplaceSync');

// Sync price to all connected marketplaces
async function syncPriceToMarketplaces(product, userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    const results = {
      platforms: [],
      totalSynced: 0,
      failed: 0
    };

    for (const integration of user.marketplaceIntegrations) {
      if (integration.isConnected) {
        const listing = product.marketplaceListings.find(
          l => l.platform === integration.platform && l.isActive
        );

        if (listing) {
          try {
            await syncToMarketplace(product, integration.platform, userId);
            results.platforms.push({
              platform: integration.platform,
              success: true,
              price: product.pricing.sellingPrice
            });
            results.totalSynced++;
          } catch (error) {
            results.platforms.push({
              platform: integration.platform,
              success: false,
              error: error.message
            });
            results.failed++;
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Price sync error:', error);
    throw error;
  }
}

// Apply dynamic pricing based on rules
async function applyDynamicPricing(userId) {
  try {
    const products = await Product.find({
      createdBy: userId,
      status: 'active'
    });

    const results = {
      total: products.length,
      updated: 0,
      skipped: 0
    };

    for (const product of products) {
      let newPrice = product.pricing.sellingPrice;
      let shouldUpdate = false;

      // Rule 1: Minimum margin check
      const currentMargin = ((product.pricing.sellingPrice - product.pricing.costPrice) / product.pricing.sellingPrice) * 100;
      if (currentMargin < 20) {
        newPrice = product.pricing.costPrice / 0.8; // Ensure 20% margin
        shouldUpdate = true;
      }

      // Rule 2: Demand-based pricing
      if (product.aiData?.demandScore > 80 && product.aiData?.trendDirection === 'rising') {
        newPrice = product.pricing.sellingPrice * 1.05; // 5% increase for high demand
        shouldUpdate = true;
      }

      // Rule 3: Competition-based pricing
      if (product.aiData?.competitionLevel === 'high') {
        newPrice = product.pricing.sellingPrice * 0.95; // 5% decrease for high competition
        shouldUpdate = true;
      }

      // Rule 4: Low stock premium
      if (product.inventory.available < product.inventory.reorderLevel) {
        newPrice = product.pricing.sellingPrice * 1.03; // 3% premium for low stock
        shouldUpdate = true;
      }

      if (shouldUpdate && Math.abs(newPrice - product.pricing.sellingPrice) > 100) {
        product.pricing.sellingPrice = Math.round(newPrice / 100) * 100; // Round to nearest 100
        await product.save();
        results.updated++;
      } else {
        results.skipped++;
      }
    }

    return results;
  } catch (error) {
    console.error('Dynamic pricing error:', error);
    throw error;
  }
}

// Calculate optimal price for new product
async function calculateOptimalPrice(productData, marketData) {
  try {
    const { costPrice, category, competition } = productData;
    
    // Base markup
    let markup = 1.3; // 30% base markup

    // Adjust based on category
    const categoryMarkups = {
      'electronics': 1.25,
      'fashion': 1.5,
      'home': 1.35,
      'beauty': 1.4,
      'sports': 1.3
    };

    if (categoryMarkups[category]) {
      markup = categoryMarkups[category];
    }

    // Adjust based on competition
    if (competition === 'high') {
      markup *= 0.9; // Lower markup for high competition
    } else if (competition === 'low') {
      markup *= 1.1; // Higher markup for low competition
    }

    const sellingPrice = costPrice * markup;
    
    // Round to nearest 100
    const roundedPrice = Math.round(sellingPrice / 100) * 100;

    return {
      costPrice,
      sellingPrice: roundedPrice,
      margin: ((roundedPrice - costPrice) / roundedPrice) * 100,
      markup: markup,
      reasoning: {
        baseMarkup: 1.3,
        categoryAdjustment: categoryMarkups[category] || 1.3,
        competitionAdjustment: competition === 'high' ? 0.9 : competition === 'low' ? 1.1 : 1
      }
    };
  } catch (error) {
    console.error('Optimal price calculation error:', error);
    throw error;
  }
}

// Get price history for product
async function getPriceHistory(productId, userId) {
  try {
    // This would typically use a PriceHistory model
    // For now, return placeholder data
    const history = [
      {
        date: new Date(Date.now() - 86400000 * 7),
        price: 150000,
        reason: 'Manual update'
      },
      {
        date: new Date(Date.now() - 86400000 * 14),
        price: 145000,
        reason: 'Auto-pricing'
      },
      {
        date: new Date(Date.now() - 86400000 * 21),
        price: 140000,
        reason: 'Initial price'
      }
    ];

    return history;
  } catch (error) {
    console.error('Price history error:', error);
    throw error;
  }
}

module.exports = {
  syncPriceToMarketplaces,
  applyDynamicPricing,
  calculateOptimalPrice,
  getPriceHistory
};
