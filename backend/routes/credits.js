const express = require('express');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current credits
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await req.db.query('SELECT credits FROM users WHERE id = $1', [req.userId]);
    res.json({ credits: result.rows[0]?.credits || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add credits (webhook for Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;
      const credits = parseInt(paymentIntent.metadata.credits);
      
      await req.db.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [credits, userId]);
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;