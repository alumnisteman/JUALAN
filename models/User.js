const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'reseller', 'supplier'],
    default: 'reseller'
  },
  storeName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  marketplaceIntegrations: [{
    platform: {
      type: String,
      enum: ['shopee', 'tokopedia', 'tiktok', 'zalora']
    },
    shopId: String,
    accessToken: String,
    refreshToken: String,
    isConnected: {
      type: Boolean,
      default: false
    },
    lastSync: Date
  }],
  notificationSettings: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    telegram: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  },
  aiSettings: {
    autoPricing: { type: Boolean, default: false },
    autoContent: { type: Boolean, default: false },
    autoReply: { type: Boolean, default: false },
    riskLevel: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled'],
      default: 'trial'
    },
    expiresAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
