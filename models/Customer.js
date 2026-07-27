const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'office', 'other']
    },
    street: String,
    city: String,
    province: String,
    postalCode: String,
    isDefault: { type: Boolean, default: false }
  }],
  marketplaceProfiles: [{
    platform: {
      type: String,
      enum: ['shopee', 'tokopedia', 'tiktok', 'zalora']
    },
    customerId: String,
    username: String
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  crmData: {
    segment: {
      type: String,
      enum: ['new', 'occasional', 'regular', 'vip', 'churned'],
      default: 'new'
    },
    lifetimeValue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastOrderDate: Date,
    preferredCategories: [String],
    communicationPreference: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  aiInsights: {
    churnRisk: { type: Number, min: 0, max: 100 },
    nextPurchasePrediction: Date,
    recommendedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    sentimentScore: { type: Number, min: -1, max: 1 }
  },
  tags: [String],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search
customerSchema.index({ name: 'text', email: 1, phone: 1 });
customerSchema.index({ 'crmData.segment': 1 });
customerSchema.index({ 'crmData.lastOrderDate': -1 });

module.exports = mongoose.model('Customer', customerSchema);
