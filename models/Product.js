const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: String,
  brand: String,
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  pricing: {
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discountPrice: Number,
    currency: { type: String, default: 'IDR' }
  },
  inventory: {
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }
  },
  marketplaceListings: [{
    platform: {
      type: String,
      enum: ['shopee', 'tokopedia', 'tiktok', 'zalora']
    },
    productId: String,
    shopId: String,
    isActive: { type: Boolean, default: true },
    lastSync: Date,
    platformSpecificData: mongoose.Schema.Types.Mixed
  }],
  aiData: {
    demandScore: { type: Number, min: 0, max: 100 },
    profitMargin: { type: Number },
    competitionLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    trendDirection: {
      type: String,
      enum: ['rising', 'stable', 'declining']
    },
    recommendedPrice: Number,
    lastAnalysis: Date
  },
  attributes: [{
    name: String,
    value: String
  }],
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Update available quantity
productSchema.pre('save', function(next) {
  this.inventory.available = this.inventory.quantity - this.inventory.reserved;
  next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text', sku: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'marketplaceListings.platform': 1, 'marketplaceListings.isActive': 1 });

module.exports = mongoose.model('Product', productSchema);
