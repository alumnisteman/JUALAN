const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Analyze product for demand, competition, and pricing
async function analyzeProduct(product) {
  if (!openai) {
    // Fallback to basic analysis when OpenAI is not available
    const margin = ((product.pricing.sellingPrice - product.pricing.costPrice) / product.pricing.sellingPrice) * 100;
    return {
      demandScore: 50,
      competitionLevel: 'medium',
      trendDirection: 'stable',
      recommendedPrice: product.pricing.sellingPrice,
      profitMargin: margin
    };
  }

  try {
    const prompt = `Analyze this product for e-commerce reselling:
    Product: ${product.name}
    Category: ${product.category}
    Current Price: ${product.pricing.sellingPrice}
    Cost Price: ${product.pricing.costPrice}
    Description: ${product.description || 'N/A'}

    Provide:
    1. Demand score (0-100)
    2. Competition level (low/medium/high)
    3. Trend direction (rising/stable/declining)
    4. Recommended price
    5. Profit margin percentage

    Return as JSON.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    
    return {
      demandScore: analysis.demandScore || 50,
      competitionLevel: analysis.competitionLevel || 'medium',
      trendDirection: analysis.trendDirection || 'stable',
      recommendedPrice: analysis.recommendedPrice || product.pricing.sellingPrice,
      profitMargin: analysis.profitMargin || 0
    };
  } catch (error) {
    console.error('AI Analysis error:', error);
    // Fallback to basic analysis
    const margin = ((product.pricing.sellingPrice - product.pricing.costPrice) / product.pricing.sellingPrice) * 100;
    return {
      demandScore: 50,
      competitionLevel: 'medium',
      trendDirection: 'stable',
      recommendedPrice: product.pricing.sellingPrice,
      profitMargin: margin
    };
  }
}

// Recommend optimal price
async function recommendPrice(product) {
  try {
    const analysis = await analyzeProduct(product);
    
    // Calculate recommended price based on AI analysis and market conditions
    let recommendedPrice = product.pricing.sellingPrice;
    
    if (analysis.trendDirection === 'rising' && analysis.demandScore > 70) {
      recommendedPrice = product.pricing.sellingPrice * 1.1; // 10% increase
    } else if (analysis.competitionLevel === 'high') {
      recommendedPrice = product.pricing.sellingPrice * 0.95; // 5% decrease
    }

    // Ensure minimum margin
    const minMargin = 20; // 20% minimum margin
    const minPrice = product.pricing.costPrice / (1 - minMargin / 100);
    
    return {
      currentPrice: product.pricing.sellingPrice,
      recommendedPrice: Math.max(recommendedPrice, minPrice),
      reasoning: analysis,
      confidence: analysis.demandScore / 100
    };
  } catch (error) {
    console.error('Price recommendation error:', error);
    return {
      currentPrice: product.pricing.sellingPrice,
      recommendedPrice: product.pricing.sellingPrice,
      reasoning: { error: 'AI service unavailable' },
      confidence: 0
    };
  }
}

// Generate marketing content
async function generateContent(product, contentType) {
  if (!openai) {
    return {
      type: contentType,
      content: `Content for ${product.name}. [AI service unavailable - configure OPENAI_API_KEY]`,
      generatedAt: new Date()
    };
  }

  try {
    let prompt = '';
    
    switch (contentType) {
      case 'description':
        prompt = `Write a compelling product description for:
        Product: ${product.name}
        Category: ${product.category}
        Price: ${product.pricing.sellingPrice}
        Features: ${product.attributes?.map(a => `${a.name}: ${a.value}`).join(', ') || 'N/A'}
        
        Make it SEO-friendly and persuasive for Indonesian market.`;
        break;
      case 'social_media':
        prompt = `Create engaging social media content for Instagram/TikTok about:
        Product: ${product.name}
        Price: ${product.pricing.sellingPrice}
        Key selling points: ${product.description || 'N/A'}
        
        Include hashtags and emoji. Make it trendy and shareable.`;
        break;
      case 'ad_copy':
        prompt = `Write high-converting ad copy for:
        Product: ${product.name}
        Price: ${product.pricing.sellingPrice}
        Target audience: Indonesian online shoppers
        
        Include headline, body, and call-to-action.`;
        break;
      default:
        throw new Error('Invalid content type');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      type: contentType,
      content: completion.choices[0].message.content,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Content generation error:', error);
    return {
      type: contentType,
      content: `Content for ${product.name}. [AI service unavailable - using placeholder]`,
      generatedAt: new Date()
    };
  }
}

// Analyze customer behavior and insights
async function analyzeCustomer(customer) {
  try {
    const orders = await Order.find({ 'customer.email': customer.email });
    
    const totalSpent = orders.reduce((sum, order) => sum + order.pricing.total, 0);
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    const lastOrder = orders.sort((a, b) => b.createdAt - a.createdAt)[0];
    
    // Calculate churn risk based on order frequency and recency
    const daysSinceLastOrder = lastOrder ? (Date.now() - lastOrder.createdAt) / (1000 * 60 * 60 * 24) : 999;
    let churnRisk = 0;
    
    if (daysSinceLastOrder > 90) churnRisk = 80;
    else if (daysSinceLastOrder > 60) churnRisk = 50;
    else if (daysSinceLastOrder > 30) churnRisk = 30;
    
    // Predict next purchase
    const avgDaysBetweenOrders = orders.length > 1 
      ? orders.reduce((sum, order, i) => {
          if (i === 0) return 0;
          return sum + (order.createdAt - orders[i-1].createdAt);
        }, 0) / (orders.length - 1) / (1000 * 60 * 60 * 24)
      : 30;

    return {
      churnRisk,
      nextPurchasePrediction: new Date(Date.now() + avgDaysBetweenOrders * 24 * 60 * 60 * 1000),
      lifetimeValue: totalSpent,
      averageOrderValue: avgOrderValue,
      orderFrequency: orders.length,
      preferredCategories: customer.crmData.preferredCategories || []
    };
  } catch (error) {
    console.error('Customer analysis error:', error);
    return {
      churnRisk: 50,
      nextPurchasePrediction: null,
      lifetimeValue: 0,
      averageOrderValue: 0,
      orderFrequency: 0,
      preferredCategories: []
    };
  }
}

// Analyze market trends
async function analyzeTrends(userId, category, days) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await Order.find({
      createdBy: userId,
      createdAt: { $gte: startDate }
    }).populate('items.product');

    // Aggregate product categories
    const categorySales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.product?.category || 'other';
        categorySales[cat] = (categorySales[cat] || 0) + item.subtotal;
      });
    });

    // Get top trending categories
    const sortedCategories = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      period: `${days} days`,
      topCategories: sortedCategories.map(([cat, revenue]) => ({
        category: cat,
        revenue,
        growth: Math.random() * 30 - 10 // Simulated growth
      })),
      totalRevenue: Object.values(categorySales).reduce((a, b) => a + b, 0)
    };
  } catch (error) {
    console.error('Trend analysis error:', error);
    return {
      period: `${days} days`,
      topCategories: [],
      totalRevenue: 0
    };
  }
}

// Detect potential fraud
async function detectFraud(order) {
  try {
    let riskScore = 0;
    const flags = [];

    // Check for unusual order value
    if (order.pricing.total > 10000000) { // > 10 million IDR
      riskScore += 20;
      flags.push('High order value');
    }

    // Check for new customer with large order
    const customerOrders = await Order.find({ 'customer.email': order.customer.email });
    if (customerOrders.length === 0 && order.pricing.total > 2000000) {
      riskScore += 30;
      flags.push('New customer with large order');
    }

    // Check for shipping address mismatch
    if (order.customer.address && order.customer.address.city) {
      const sameCityOrders = customerOrders.filter(
        o => o.customer.address?.city === order.customer.address.city
      );
      if (sameCityOrders.length === 0 && customerOrders.length > 0) {
        riskScore += 15;
        flags.push('Shipping address mismatch');
      }
    }

    // Check for rapid orders
    const recentOrders = customerOrders.filter(
      o => o.createdAt > new Date(Date.now() - 3600000) // Last hour
    );
    if (recentOrders.length > 3) {
      riskScore += 25;
      flags.push('Rapid multiple orders');
    }

    return {
      riskScore: Math.min(riskScore, 100),
      flags,
      recommendation: riskScore > 50 ? 'Manual review required' : 'Auto-approve'
    };
  } catch (error) {
    console.error('Fraud detection error:', error);
    return {
      riskScore: 0,
      flags: [],
      recommendation: 'Auto-approve'
    };
  }
}

// Hunt for profitable products
async function huntProducts(userId, criteria) {
  try {
    const products = await Product.find({
      createdBy: userId,
      status: 'active'
    });

    let recommendations = products.map(product => {
      const margin = ((product.pricing.sellingPrice - product.pricing.costPrice) / product.pricing.sellingPrice) * 100;
      const demandScore = product.aiData?.demandScore || 50;
      
      let score = margin * 0.4 + demandScore * 0.6;
      
      if (criteria.minMargin && margin < criteria.minMargin) score = 0;
      if (criteria.budget && product.pricing.costPrice > criteria.budget) score = 0;
      if (criteria.category && product.category !== criteria.category) score = 0;

      return {
        product,
        score,
        margin,
        demandScore,
        recommendation: score > 60 ? 'High potential' : score > 40 ? 'Moderate' : 'Low potential'
      };
    });

    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations.slice(0, 20);
  } catch (error) {
    console.error('Product hunting error:', error);
    return [];
  }
}

module.exports = {
  analyzeProduct,
  recommendPrice,
  generateContent,
  analyzeCustomer,
  analyzeTrends,
  detectFraud,
  huntProducts
};
