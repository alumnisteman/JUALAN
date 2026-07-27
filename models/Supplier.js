const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  contact: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String
    }
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  integration: {
    type: {
      type: String,
      enum: ['manual', 'api', 'csv', 'xml']
    },
    endpoint: String,
    apiKey: String,
    lastSync: Date,
    syncFrequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'manual'],
      default: 'daily'
    }
  },
  performance: {
    rating: { type: Number, min: 1, max: 5, default: 3 },
    onTimeDeliveryRate: { type: Number, min: 0, max: 100 },
    qualityScore: { type: Number, min: 0, max: 100 },
    totalOrders: { type: Number, default: 0 }
  },
  paymentTerms: {
    method: {
      type: String,
      enum: ['cod', 'credit_30', 'credit_45', 'credit_60']
    },
    creditLimit: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate supplier code
supplierSchema.pre('save', async function(next) {
  if (!this.code) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.code = `SUP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Supplier', supplierSchema);
