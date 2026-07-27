# ResellerHub AI - Platform Otomatisasi Reseller

Platform otomatisasi reseller berbasis AI yang mengintegrasikan semua modul untuk manajemen bisnis e-commerce yang efisien.

## 🚀 Fitur Utama

### Core Modules
- **Dashboard** - Overview bisnis real-time dengan statistik dan analitik
- **Product Management** - Manajemen produk dengan AI-powered insights
- **Order Management** - Manajemen pesanan otomatis dari berbagai marketplace
- **Inventory Management** - Sinkronisasi stok terpusat dengan predictive restock
- **CRM** - Manajemen pelanggan dengan segmentasi dan AI insights
- **Pricing Engine** - Dynamic pricing otomatis berbasis AI

### AI-Powered Features
- **Product Analysis** - Analisis demand, kompetisi, dan trend produk
- **Price Recommendation** - Rekomendasi harga optimal berbasis market data
- **Content Generation** - Generate deskripsi produk dan konten marketing otomatis
- **Customer Insights** - Analisis perilaku pelanggan dan churn prediction
- **Fraud Detection** - Deteksi fraud otomatis pada pesanan
- **Product Hunting** - Rekomendasi produk potensial untuk di-resell

### Marketplace Integration
- **Shopee** - Integrasi API Shopee untuk sync produk dan pesanan
- **Tokopedia** - Integrasi API Tokopedia untuk sync produk dan pesanan
- **TikTok Shop** - Integrasi API TikTok untuk sync produk dan pesanan
- **Zalora** - Integrasi API Zalora untuk sync produk dan pesanan

### Automation
- **Auto Pricing** - Penyesuaian harga otomatis berdasarkan market conditions
- **Auto Content** - Generate konten marketing otomatis
- **Auto Reply** - Balas pesan pelanggan otomatis dengan AI
- **Inventory Sync** - Sinkronisasi stok otomatis antar marketplace
- **Order Sync** - Sinkronisasi pesanan otomatis dari semua marketplace

### Notifications
- **Multi-channel** - Email, WhatsApp, Telegram, dan Push notifications
- **Real-time** - WebSocket untuk update real-time
- **Smart Alerts** - Notifikasi pintar untuk low stock, new orders, dll

## 📋 Prerequisites

- Node.js v16 atau higher
- MongoDB v4.4 atau higher
- Redis (opsional, untuk caching)
- API Keys untuk marketplace yang ingin diintegrasikan

## 🔧 Installation

1. **Clone repository**
```bash
git clone https://github.com/alumnisteman/Reseller.git
cd Reseller
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` file dan isi dengan konfigurasi Anda:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/resellerhub
JWT_SECRET=your_jwt_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here
SHOPEE_API_KEY=your_shopee_api_key
SHOPEE_API_SECRET=your_shopee_api_secret
TOKOPEDIA_API_KEY=your_tokopedia_api_key
TOKOPEDIA_API_SECRET=your_tokopedia_api_secret
TIKTOK_API_KEY=your_tiktok_api_key
TIKTOK_API_SECRET=your_tiktok_api_secret
```

4. **Start MongoDB**
```bash
# Jika menggunakan MongoDB lokal
mongod

# Atau menggunakan MongoDB Atlas
# Update MONGODB_URI di .env dengan connection string Atlas
```

5. **Start server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📁 Project Structure

```
Reseller/
├── server.js                 # Main server entry point
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── models/                   # Database models
│   ├── User.js              # User model with integrations
│   ├── Product.js           # Product model with AI data
│   ├── Order.js             # Order model with fulfillment
│   ├── Supplier.js          # Supplier model
│   └── Customer.js          # Customer model with CRM data
├── routes/                   # API routes
│   ├── auth.js              # Authentication endpoints
│   ├── dashboard.js         # Dashboard analytics
│   ├── products.js          # Product management
│   ├── orders.js            # Order management
│   ├── inventory.js         # Inventory management
│   ├── ai.js                # AI-powered features
│   ├── marketplace.js       # Marketplace integration
│   ├── automation.js        # Automation management
│   ├── notifications.js     # Notification system
│   ├── crm.js               # CRM features
│   └── pricing.js           # Pricing engine
├── services/                 # Business logic services
│   ├── aiService.js         # AI analysis and generation
│   ├── marketplaceSync.js   # Marketplace sync logic
│   ├── automationScheduler.js # Scheduled tasks
│   ├── automationService.js # Automation execution
│   ├── notificationService.js # Notification delivery
│   ├── supplierSync.js      # Supplier inventory sync
│   ├── pricingService.js    # Dynamic pricing logic
│   └── websocket.js         # Real-time communication
├── middleware/               # Express middleware
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling
├── resellerhub_dashboard/    # Dashboard UI module
├── resellerhub_os/          # Operating System UI module
├── resellerhub_ai_*/        # AI-powered UI modules
├── otorisasi_api_*/         # API authorization UI modules
└── sync_*.bat               # Sync scripts
```

## 🔌 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "storeName": "My Store",
  "phone": "+628123456789"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Dashboard

#### Get Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

#### Get Revenue Trends
```http
GET /api/dashboard/revenue-trends?period=30
Authorization: Bearer <token>
```

### Products

#### Get All Products
```http
GET /api/products?page=1&limit=20&category=electronics&status=active
Authorization: Bearer <token>
```

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Wireless Headphones",
  "sku": "WH-001",
  "description": "High-quality wireless headphones",
  "category": "electronics",
  "pricing": {
    "costPrice": 500000,
    "sellingPrice": 750000,
    "currency": "IDR"
  },
  "inventory": {
    "quantity": 100,
    "reorderLevel": 10
  }
}
```

#### Sync to Marketplace
```http
POST /api/products/:id/sync/shopee
Authorization: Bearer <token>
```

### Orders

#### Get All Orders
```http
GET /api/orders?page=1&limit=20&status=pending
Authorization: Bearer <token>
```

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+628987654321",
    "address": {
      "street": "123 Main St",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "10110"
    }
  },
  "items": [
    {
      "product": "product_id",
      "quantity": 2,
      "price": 750000
    }
  ],
  "marketplace": {
    "platform": "shopee",
    "orderId": "SHP-12345"
  }
}
```

### AI Features

#### Analyze Product
```http
POST /api/ai/analyze-product
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id"
}
```

#### Generate Content
```http
POST /api/ai/generate-content
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id",
  "contentType": "description"
}
```

### Marketplace Integration

#### Connect Marketplace
```http
POST /api/marketplace/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "platform": "shopee",
  "shopId": "your_shop_id",
  "accessToken": "your_access_token",
  "refreshToken": "your_refresh_token"
}
```

#### Sync Marketplace
```http
POST /api/marketplace/sync/shopee
Authorization: Bearer <token>
Content-Type: application/json

{
  "syncType": "full"
}
```

### Automation

#### Get All Automations
```http
GET /api/automation
Authorization: Bearer <token>
```

#### Toggle Automation
```http
PUT /api/automation/auto-pricing/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true
}
```

#### Run Automation Manually
```http
POST /api/automation/auto-pricing/run
Authorization: Bearer <token>
```

## 🔗 Module Integration

### Data Flow Between Modules

1. **Product → AI → Pricing**
   - Product data → AI analysis → Price recommendation → Dynamic pricing

2. **Marketplace → Orders → Inventory**
   - Marketplace sync → Order creation → Inventory deduction

3. **Orders → CRM → AI**
   - Order data → Customer profile → AI insights → Churn prediction

4. **Inventory → Automation → Notifications**
   - Low stock detection → Auto-reorder → Notification alert

5. **AI → Content → Marketing**
   - Product analysis → Content generation → Social media posting

### WebSocket Events

Real-time updates via WebSocket:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});

// Subscribe to updates
socket.emit('subscribe:dashboard');
socket.emit('subscribe:orders');
socket.emit('subscribe:inventory');

// Listen for events
socket.on('product:created', (product) => {
  console.log('New product:', product);
});

socket.on('order:created', (order) => {
  console.log('New order:', order);
});

socket.on('inventory:adjusted', (data) => {
  console.log('Inventory adjusted:', data);
});

socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

## 🤖 AI Service Configuration

### OpenAI Integration

The AI service uses OpenAI GPT-3.5-turbo for:
- Product analysis and demand prediction
- Price optimization
- Content generation
- Customer behavior analysis

Configure your OpenAI API key in `.env`:
```env
OPENAI_API_KEY=sk-your-openai-api-key
```

### AI Features Available

1. **Product Analysis**
   - Demand score (0-100)
   - Competition level
   - Trend direction
   - Recommended price
   - Profit margin

2. **Content Generation**
   - Product descriptions
   - Social media content
   - Ad copy
   - Email templates

3. **Customer Insights**
   - Churn risk prediction
   - Next purchase prediction
   - Lifetime value calculation
   - Sentiment analysis

## 📊 Automation Schedule

Default automation schedules:

- **Auto Pricing**: Every 6 hours
- **Auto Content**: Daily at midnight
- **Inventory Sync**: Every hour
- **Order Sync**: Every 15 minutes
- **Low Stock Check**: Every 2 hours

Customize schedules in `services/automationScheduler.js`

## 🔔 Notification Channels

Configure notification channels in user settings:

```javascript
{
  "notificationSettings": {
    "email": true,
    "whatsapp": true,
    "telegram": false,
    "push": true
  }
}
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name resellerhub
pm2 save
pm2 startup
```

### Using Docker
```bash
docker build -t resellerhub .
docker run -p 3000:3000 --env-file .env resellerhub
```

## 📝 Environment Variables

Required variables:
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `OPENAI_API_KEY` - OpenAI API key

Optional variables:
- `REDIS_URI` - Redis connection string
- `SHOPEE_API_KEY` - Shopee API key
- `TOKOPEDIA_API_KEY` - Tokopedia API key
- `TIKTOK_API_KEY` - TikTok API key
- `WHATSAPP_API_KEY` - WhatsApp API key
- `TELEGRAM_BOT_TOKEN` - Telegram bot token

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@resellerhub.ai or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Additional marketplace integrations (Lazada, Blibli)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] White-label solution
- [ ] API for third-party integrations
