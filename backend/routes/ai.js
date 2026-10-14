const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Initialize Gemini
let genAI;
let model;
const initGemini = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return false;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return true;
};

// Multer for image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// Helper to get product context from DB
const getProductContext = async (limit = 20) => {
  const result = await query(
    `SELECT p.name, p.slug, p.price, p.compare_price, p.brand, p.rating_average, p.rating_count,
      p.stock_quantity, p.description, p.tags, c.name as category
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = true
     ORDER BY p.rating_average DESC, p.sold_count DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

const getRelevantProducts = async (searchTerm, limit = 10) => {
  const result = await query(
    `SELECT p.name, p.slug, p.price, p.brand, p.rating_average, p.rating_count,
      p.stock_quantity, p.short_description, c.name as category,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = true
       AND (p.name ILIKE $1 OR p.description ILIKE $1 OR p.brand ILIKE $1 OR c.name ILIKE $1 OR p.tags::text ILIKE $1)
     ORDER BY p.rating_average DESC
     LIMIT $2`,
    [`%${searchTerm}%`, limit]
  );
  return result.rows;
};

// POST /api/ai/chat - Main conversational agent
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    if (!initGemini()) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'Please add GEMINI_API_KEY to enable AI features',
        fallback: true,
      });
    }
    
    const { message, history = [], language = 'en', session_id } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get product catalog context
    const products = await getProductContext(30);
    const relevantProducts = await getRelevantProducts(message, 8);
    
    const systemPrompt = `You are SmartCart AI, a helpful and knowledgeable shopping assistant for SmartCart, an e-commerce platform. 

AVAILABLE PRODUCTS IN CATALOG (${products.length} items):
${products.map(p => `- ${p.name} | ₹${p.price} | ${p.category} | Rating: ${p.rating_average}/5 (${p.rating_count} reviews) | Brand: ${p.brand || 'N/A'} | Stock: ${p.stock_quantity > 0 ? 'Available' : 'Out of stock'}`).join('\n')}

RELEVANT PRODUCTS FOR THIS QUERY:
${relevantProducts.map(p => `- ${p.name} | ₹${p.price} | ${p.category} | Rating: ${p.rating_average}/5 | Brand: ${p.brand || 'N/A'} | Slug: ${p.slug}`).join('\n')}

INSTRUCTIONS:
1. Always base recommendations on ACTUAL products from the catalog above
2. When suggesting products, include their price and rating
3. Be conversational, helpful, and honest
4. If a product isn't in the catalog, say so clearly
5. Help with budget planning, comparisons, quality assessment
6. Always respond in ${language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : language === 'te' ? 'Telugu' : 'English'} as requested
7. Format product suggestions clearly with names and prices
8. Never make up product information
9. If the user asks about payment, mention that COD (Cash on Delivery) and card payments are available
10. Keep responses concise but informative`;
    
    // Build conversation
    const chat = model.startChat({
      history: history.slice(-10).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
    
    const result = await chat.sendMessage(`${systemPrompt}\n\nUser message: ${message}`);
    const responseText = result.response.text();
    
    // Extract mentioned products for quick links
    const mentionedProducts = relevantProducts.filter(p =>
      responseText.toLowerCase().includes(p.name.toLowerCase().substring(0, 10))
    ).slice(0, 3);
    
    // Save conversation if user is logged in
    if (req.user && session_id) {
      await query(
        `INSERT INTO ai_conversations (user_id, session_id, messages)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [req.user.id, session_id, JSON.stringify([{ role: 'user', content: message }, { role: 'assistant', content: responseText }])]
      ).catch(() => {}); // Non-critical
    }
    
    res.json({
      response: responseText,
      suggested_products: mentionedProducts,
      language,
    });
  } catch (err) {
    console.error('AI chat error:', err);
    if (err.message?.includes('API_KEY_INVALID')) {
      return res.status(503).json({ error: 'Invalid Gemini API key', fallback: true });
    }
    res.status(500).json({ error: 'AI response failed', details: err.message });
  }
});

// POST /api/ai/recommendations - Personalized recommendations
router.post('/recommendations', optionalAuth, async (req, res) => {
  try {
    if (!initGemini()) {
      // Fallback: return top-rated products
      const fallback = await query(
        `SELECT p.*, c.name as category_name,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true ORDER BY p.rating_average DESC LIMIT 8`
      );
      return res.json({ products: fallback.rows, ai_powered: false });
    }
    
    const { budget, preferences, category } = req.body;
    
    // Get user order history if logged in
    let userContext = '';
    if (req.user) {
      const history = await query(
        `SELECT p.name, p.category_id, oi.quantity FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 ORDER BY o.created_at DESC LIMIT 10`,
        [req.user.id]
      );
      if (history.rows.length > 0) {
        userContext = `User's purchase history: ${history.rows.map(h => h.name).join(', ')}`;
      }
    }
    
    const products = await getProductContext(50);
    
    const prompt = `Based on the following criteria, recommend 5-8 products from our catalog:
Budget: ${budget ? `₹${budget}` : 'No specific budget'}
Preferences: ${preferences || 'General shopping'}
Category interest: ${category || 'Any'}
${userContext}

AVAILABLE PRODUCTS:
${products.map(p => `- ${p.name} | ₹${p.price} | ${p.category} | Rating: ${p.rating_average}/5 | Slug: ${p.slug}`).join('\n')}

Return a JSON array with this exact format (nothing else):
[{"slug": "product-slug", "reason": "why this product is recommended"}]`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse AI recommendations
    let aiRecs = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiRecs = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, get top rated products as fallback
    }
    
    // Fetch actual product data
    let recommendedProducts = [];
    if (aiRecs.length > 0) {
      const slugs = aiRecs.map(r => r.slug);
      const dbResult = await query(
        `SELECT p.*, c.name as category_name,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ANY($1) AND p.is_active = true`,
        [slugs]
      );
      recommendedProducts = dbResult.rows.map(p => ({
        ...p,
        ai_reason: aiRecs.find(r => r.slug === p.slug)?.reason || 'Recommended for you',
      }));
    }
    
    if (recommendedProducts.length === 0) {
      const fallback = await query(
        `SELECT p.*, c.name as category_name,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true ${budget ? 'AND p.price <= $1' : ''}
         ORDER BY p.rating_average DESC LIMIT 8`,
        budget ? [parseFloat(budget)] : []
      );
      recommendedProducts = fallback.rows.map(p => ({ ...p, ai_reason: 'Top rated product' }));
    }
    
    res.json({ products: recommendedProducts, ai_powered: true });
  } catch (err) {
    console.error('AI recommendations error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// POST /api/ai/compare - Compare products
router.post('/compare', optionalAuth, async (req, res) => {
  try {
    const { product_ids } = req.body;
    if (!product_ids || product_ids.length < 2) {
      return res.status(400).json({ error: 'At least 2 product IDs required' });
    }
    
    const result = await query(
      `SELECT p.*, c.name as category_name,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
        (SELECT json_agg(json_build_object('rating', rating, 'body', body, 'title', title) ORDER BY helpful_count DESC LIMIT 3) FROM reviews WHERE product_id = p.id AND is_approved = true) as top_reviews
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ANY($1)`,
      [product_ids]
    );
    
    const products = result.rows;
    let aiAnalysis = null;
    
    if (initGemini() && products.length > 0) {
      const prompt = `Compare these products and provide a detailed analysis:
${products.map(p => `
Product: ${p.name}
Price: ₹${p.price}
Brand: ${p.brand || 'Unknown'}
Rating: ${p.rating_average}/5 (${p.rating_count} reviews)
Stock: ${p.stock_quantity > 0 ? 'Available' : 'Out of stock'}
Category: ${p.category_name}
`).join('\n---\n')}

Provide:
1. Which product offers best value for money
2. Key differences
3. Who should buy each product
4. Overall recommendation

Be honest and balanced. If ratings are similar, say so.`;
      
      try {
        const aiResult = await model.generateContent(prompt);
        aiAnalysis = aiResult.response.text();
      } catch (e) {
        aiAnalysis = null;
      }
    }
    
    res.json({ products, ai_analysis: aiAnalysis });
  } catch (err) {
    console.error('Compare error:', err);
    res.status(500).json({ error: 'Failed to compare products' });
  }
});

// POST /api/ai/analyze-image - Analyze product image
router.post('/analyze-image', optionalAuth, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    
    if (!initGemini()) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'Add GEMINI_API_KEY to enable image analysis',
      });
    }
    
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };
    
    const products = await getProductContext(50);
    
    const prompt = `Analyze this product image and:
1. Identify what product/item is shown
2. Assess the apparent quality (be honest - include uncertainty warnings if unclear)
3. Find similar products from our catalog:

CATALOG:
${products.map(p => `- ${p.name} | ₹${p.price} | ${p.category} | Slug: ${p.slug}`).join('\n')}

Provide your response in this JSON format:
{
  "identified_item": "what you see",
  "confidence": "high/medium/low",
  "quality_assessment": "your honest assessment",
  "uncertainty_warnings": "any caveats about your analysis",
  "similar_products": [{"slug": "product-slug", "match_reason": "why similar"}]
}`;
    
    const result = await visionModel.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { identified_item: responseText, confidence: 'low' };
    } catch {
      analysis = { identified_item: responseText, confidence: 'low', quality_assessment: 'Analysis complete', uncertainty_warnings: 'Could not parse structured response' };
    }
    
    // Fetch matching products
    let matchedProducts = [];
    if (analysis.similar_products && analysis.similar_products.length > 0) {
      const slugs = analysis.similar_products.map(p => p.slug);
      const dbResult = await query(
        `SELECT p.id, p.name, p.slug, p.price, p.rating_average,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
         FROM products p WHERE p.slug = ANY($1) AND p.is_active = true`,
        [slugs]
      );
      matchedProducts = dbResult.rows.map(p => ({
        ...p,
        match_reason: analysis.similar_products.find(s => s.slug === p.slug)?.match_reason || 'Similar item',
      }));
    }
    
    res.json({ analysis, matched_products: matchedProducts });
  } catch (err) {
    console.error('Image analysis error:', err);
    res.status(500).json({ error: 'Image analysis failed', details: err.message });
  }
});

// POST /api/ai/review-summary - Summarize product reviews
router.post('/review-summary/:productId', optionalAuth, async (req, res) => {
  try {
    const reviewsResult = await query(
      `SELECT r.rating, r.title, r.body, r.is_verified_purchase FROM reviews r
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.helpful_count DESC, r.created_at DESC
       LIMIT 20`,
      [req.params.productId]
    );
    
    const reviews = reviewsResult.rows;
    if (reviews.length === 0) {
      return res.json({ summary: 'No reviews yet for this product.', sentiment: 'neutral', review_count: 0 });
    }
    
    if (!initGemini()) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      return res.json({
        summary: `Based on ${reviews.length} reviews with an average rating of ${avg.toFixed(1)}/5.`,
        sentiment: avg >= 4 ? 'positive' : avg >= 3 ? 'mixed' : 'negative',
        review_count: reviews.length,
        ai_powered: false,
      });
    }
    
    const prompt = `Summarize these ${reviews.length} product reviews in 2-3 sentences:

${reviews.map(r => `Rating: ${r.rating}/5${r.title ? ` | ${r.title}` : ''}${r.body ? `\n"${r.body}"` : ''}`).join('\n\n')}

Focus on: overall sentiment, common praise, common complaints, and whether reviews seem genuine.
Also classify overall sentiment as: positive, mixed, or negative.
Format as JSON: {"summary": "...", "sentiment": "positive|mixed|negative", "key_pros": ["..."], "key_cons": ["..."]}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let parsedSummary;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsedSummary = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: responseText, sentiment: 'mixed' };
    } catch {
      parsedSummary = { summary: responseText, sentiment: 'mixed', key_pros: [], key_cons: [] };
    }
    
    res.json({ ...parsedSummary, review_count: reviews.length, ai_powered: true });
  } catch (err) {
    console.error('Review summary error:', err);
    res.status(500).json({ error: 'Failed to summarize reviews' });
  }
});

// POST /api/ai/budget-suggestions - Budget-based suggestions
router.post('/budget-suggestions', optionalAuth, async (req, res) => {
  try {
    const { budget, category, occasion } = req.body;
    if (!budget || budget < 1) return res.status(400).json({ error: 'Valid budget required' });
    
    const products = await query(
      `SELECT p.name, p.slug, p.price, p.brand, p.rating_average, p.rating_count,
        c.name as category,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.price <= $1 AND p.stock_quantity > 0
         ${category ? 'AND c.slug = $2' : ''}
       ORDER BY p.rating_average DESC, p.price DESC
       LIMIT 20`,
      category ? [parseFloat(budget), category] : [parseFloat(budget)]
    );
    
    if (!initGemini()) {
      return res.json({ products: products.rows.slice(0, 8), ai_powered: false });
    }
    
    const prompt = `I have a budget of ₹${budget}${occasion ? ` for ${occasion}` : ''}.
    
From these products (all within budget):
${products.rows.map(p => `- ${p.name} | ₹${p.price} | Rating: ${p.rating_average}/5 | Slug: ${p.slug}`).join('\n')}

Suggest the best 5-6 products that give maximum value for money within the ₹${budget} budget.
Return JSON: [{"slug": "...", "value_score": "high/medium", "why": "brief reason"}]`;
    
    const result = await model.generateContent(prompt);
    let suggestions = [];
    try {
      const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {}
    
    let finalProducts = products.rows;
    if (suggestions.length > 0) {
      const slugOrder = suggestions.map(s => s.slug);
      finalProducts = products.rows
        .filter(p => slugOrder.includes(p.slug))
        .map(p => ({
          ...p,
          value_score: suggestions.find(s => s.slug === p.slug)?.value_score || 'medium',
          ai_reason: suggestions.find(s => s.slug === p.slug)?.why || 'Great value for money',
        }));
    }
    
    res.json({ products: finalProducts.slice(0, 8), total_budget: budget, ai_powered: true });
  } catch (err) {
    console.error('Budget suggestions error:', err);
    res.status(500).json({ error: 'Failed to get budget suggestions' });
  }
});

module.exports = router;
