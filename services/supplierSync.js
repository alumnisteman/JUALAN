const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// Sync inventory from supplier
async function syncSupplierInventory(supplier, userId) {
  try {
    const results = {
      totalProducts: 0,
      updated: 0,
      new: 0,
      errors: 0
    };

    switch (supplier.integration.type) {
      case 'api':
        const apiResult = await syncViaAPI(supplier, userId);
        Object.assign(results, apiResult);
        break;
      case 'csv':
        const csvResult = await syncViaCSV(supplier, userId);
        Object.assign(results, csvResult);
        break;
      case 'xml':
        const xmlResult = await syncViaXML(supplier, userId);
        Object.assign(results, xmlResult);
        break;
      default:
        // Manual sync - no action needed
        results.totalProducts = supplier.products.length;
    }

    supplier.integration.lastSync = new Date();
    await supplier.save();

    return results;
  } catch (error) {
    console.error('Supplier sync error:', error);
    throw error;
  }
}

// Sync via API
async function syncViaAPI(supplier, userId) {
  try {
    const axios = require('axios');
    
    const response = await axios.get(supplier.integration.endpoint, {
      headers: {
        'Authorization': `Bearer ${supplier.integration.apiKey}`
      }
    });

    const products = response.data.products || [];
    const results = { totalProducts: products.length, updated: 0, new: 0, errors: 0 };

    for (const productData of products) {
      try {
        const existingProduct = await Product.findOne({
          sku: productData.sku,
          createdBy: userId
        });

        if (existingProduct) {
          existingProduct.inventory.quantity = productData.stock;
          existingProduct.pricing.costPrice = productData.costPrice;
          await existingProduct.save();
          results.updated++;
        } else {
          const newProduct = new Product({
            name: productData.name,
            sku: productData.sku,
            category: productData.category || 'uncategorized',
            pricing: {
              costPrice: productData.costPrice,
              sellingPrice: productData.costPrice * 1.3, // 30% markup
              currency: 'IDR'
            },
            inventory: {
              quantity: productData.stock,
              available: productData.stock,
              reorderLevel: 10,
              supplierId: supplier._id
            },
            createdBy: userId
          });
          await newProduct.save();
          results.new++;
        }
      } catch (error) {
        results.errors++;
      }
    }

    return results;
  } catch (error) {
    console.error('API sync error:', error);
    throw error;
  }
}

// Sync via CSV
async function syncViaCSV(supplier, userId) {
  try {
    const fs = require('fs');
    const csv = require('csv-parser');
    
    const results = { totalProducts: 0, updated: 0, new: 0, errors: 0 };
    
    // Placeholder - actual implementation would read CSV file
    console.log(`Syncing via CSV for supplier ${supplier._id}`);
    
    return results;
  } catch (error) {
    console.error('CSV sync error:', error);
    throw error;
  }
}

// Sync via XML
async function syncViaXML(supplier, userId) {
  try {
    const axios = require('axios');
    const xml2js = require('xml2js');
    
    const response = await axios.get(supplier.integration.endpoint);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const products = result.products?.product || [];
    const syncResults = { totalProducts: products.length, updated: 0, new: 0, errors: 0 };
    
    // Process products similar to API sync
    for (const productData of products) {
      // Implementation similar to API sync
    }
    
    return syncResults;
  } catch (error) {
    console.error('XML sync error:', error);
    throw error;
  }
}

module.exports = {
  syncSupplierInventory
};
