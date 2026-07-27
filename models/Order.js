const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
      country: { type: String, default: 'Indonesia' }
    }
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    sku: String,
    name: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: Number,
    subtotal: Number
  }],
  marketplace: {
    platform: {
      type: String,
      enum: ['shopee', 'tokopedia', 'tiktok', 'zalora', 'direct']
    },
    orderId: String,
    shopId: String
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'IDR' }
  },
  payment: {
    method: {
      type: String,
      enum: ['cod', 'transfer', 'ewallet', 'credit_card']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    transactionId: String
  },
  shipping: {
    carrier: String,
    trackingNumber: String,
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'],
      default: 'pending'
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    checkpoints: [{
      status: String,
      location: String,
      timestamp: Date,
      description: String
    }]
  },
  fulfillment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'packed', 'shipped', 'completed', 'cancelled'],
      default: 'pending'
    },
    warehouse: String,
    picker: String,
    packer: String,
    packedAt: Date,
    shippedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  aiInsights: {
    fraudRisk: { type: Number, min: 0, max: 100 },
    deliveryPrediction: String,
    customerLifetimeValue: Number
  }
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.pricing.total = this.pricing.subtotal + this.pricing.shippingCost + this.pricing.tax - this.pricing.discount;
  }
  
  next();
});

// Index for search
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'marketplace.platform': 1, 'marketplace.orderId': 1 });

module.exports = mongoose.model('Order', orderSchema);
